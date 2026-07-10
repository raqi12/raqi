import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import type { AuthUser } from '../../common/auth-user.interface';
import {
  ApiAdminAuth,
  ApiMongoIdParam,
  ApiOkDataResponse,
  ApiStandardErrorResponses,
} from '../../common/swagger/decorators';
import { ComplaintDto } from '../../common/swagger/schemas/entity.schemas';
import { CustomersService } from '../customers/customers.service';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaint.dto';

@ApiTags('Customer - Complaints')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/complaints')
export class CustomerComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Submit complaint',
    description: 'Creates a new complaint for the authenticated customer.',
  })
  @ApiBody({ type: CreateComplaintDto })
  @ApiOkDataResponse(ComplaintDto, 'Complaint submitted', { status: 201 })
  async create(
    @Body() body: CreateComplaintDto,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const customer = await this.customersService.findByUserId(user.sub);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return {
      data: await this.complaintsService.create({
        customerId: String(customer.id),
        subject: body.subject,
        body: body.body,
      }),
    };
  }
}

@ApiTags('Admin - Complaints')
@ApiAdminAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admin/complaints')
export class AdminComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all complaints',
    description: 'Returns complaints across all customers for admin review.',
  })
  @ApiOkDataResponse(ComplaintDto, 'Complaint list', { isArray: true })
  async list() {
    return { data: await this.complaintsService.findAll() };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update complaint',
    description: 'Updates complaint status and/or assignee.',
  })
  @ApiMongoIdParam('id', 'Complaint MongoDB ID')
  @ApiBody({ type: UpdateComplaintDto })
  @ApiOkDataResponse(ComplaintDto, 'Complaint updated')
  async update(@Param('id') id: string, @Body() body: UpdateComplaintDto) {
    const complaint = await this.complaintsService.update(id, body);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
    return { data: complaint };
  }
}
