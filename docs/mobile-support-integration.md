# Mobile Support Page (الدعم) — API Integration Guide

The customer Support screen is driven entirely by the API. Content is edited in the admin dashboard under **صفحة الدعم** (`/support`).

## Endpoints

| Endpoint | Auth | Use when |
|----------|------|----------|
| `GET /api/v1/support` | None | Guest or simple fetch |
| `GET /api/v1/customer/support` | Customer JWT | Logged-in user |

Both return the same payload.

**Production base URL:** `https://api.raqii.com.ly/api/v1`

**Swagger:** `https://api.raqii.com.ly/api/docs` → tags **Support** / **Customer - Support**

## Request examples

```http
GET /api/v1/support
Accept: application/json
```

```http
GET /api/v1/customer/support
Authorization: Bearer <access_token>
Accept: application/json
```

## Response envelope

```json
{
  "data": {
    "contacts": { "phone", "whatsapp", "email", "twitter" },
    "workingHours": [{ "label", "startTime", "endTime" }],
    "faqs": [{ "id", "question", "answer", "sortOrder" }],
    "emergency": { "message", "phone" },
    "appInfo": { "version", "lastUpdate" }
  }
}
```

See [`raqi/fixtures/support-page.response.json`](../raqi/fixtures/support-page.response.json) for a full example matching the default seeded content.

## UI mapping

| Screen section | API field | Mobile action |
|----------------|-----------|---------------|
| اتصل بنا | `contacts.phone` | `tel:<phone>` |
| واتساب | `contacts.whatsapp` | `https://wa.me/<digits>` |
| البريد الإلكتروني | `contacts.email` | `mailto:<email>` |
| تويتر | `contacts.twitter` | `https://x.com/<handle>` |
| ساعات العمل | `workingHours[]` | Show `label` + `startTime`–`endTime` |
| الأسئلة الشائعة | `faqs[]` | Accordion; sort by `sortOrder` |
| حالة طوارئ | `emergency` | Alert card; `tel:` on phone |
| إصدار التطبيق | `appInfo.version` | Footer |
| آخر تحديث | `appInfo.lastUpdate` | Footer (admin text, not ISO date) |

### Contact deep links

```text
Phone:    tel:920000000
WhatsApp: https://wa.me/218912345678   (strip non-digits; add country code if missing)
Email:    mailto:support@text.sa
Twitter:  https://x.com/text            (handle without @)
```

## Implementation checklist

1. Fetch on screen open (`GET /support` or `/customer/support`).
2. Optional cache 5–15 minutes.
3. Loading skeleton → render sections in design order.
4. FAQs: server returns only `active` items.
5. RTL layout for Arabic text.
6. Error state with retry.
7. Do not hardcode contacts/FAQs — admin can change them without an app release.

## Related APIs (not this screen)

- **Live chat:** `POST /customer/tickets`, Socket.io namespace `/tickets`
- **Wallet history:** `GET /customer/wallet/transactions`
- **Deposit requests:** `POST /customer/deposit-requests`

## Verification

```bash
curl -s https://api.raqii.com.ly/api/v1/support | jq .
```

Local:

```bash
curl -s http://localhost:3000/api/v1/support | jq .
```
