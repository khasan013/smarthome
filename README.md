# Smart Building Manager Backend

Vercel-ready Express + MongoDB backend for the Android Smart Building Manager app.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and replace `<db_password>` with your real MongoDB password:

```env
MONGODB_URI=mongodb+srv://fgjfndfb_db_user:<db_password>@cluster0.69k4i7h.mongodb.net/smart-home?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=use-a-long-random-secret
CLIENT_ORIGIN=*
```

3. Run locally:

```bash
npm run dev
```

4. Deploy to Vercel and add the same `MONGODB_URI` and `JWT_SECRET` values in Vercel project environment variables.

## Main Endpoints

Base URL locally: `http://localhost:5000`

- `GET /api/health`
- `POST /api/auth/register/admin`
- `POST /api/auth/register/user`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/flats`
- `POST /api/flats`
- `PATCH /api/flats/:id`
- `DELETE /api/flats/:id`
- `GET /api/notices`
- `POST /api/notices`
- `DELETE /api/notices/:id`
- `GET /api/bills`
- `POST /api/bills`
- `PATCH /api/bills/:id`
- `GET /api/complaints`
- `POST /api/complaints`
- `PATCH /api/complaints/:id`

Protected endpoints need:

```http
Authorization: Bearer YOUR_TOKEN
```

## Example Requests

Register admin:

```json
{
  "adminName": "Building Admin",
  "phone": "1234",
  "buildingName": "Green Tower",
  "password": "123456"
}
```

The response includes a building `code`. Use that code for tenant registration.

Register user:

```json
{
  "name": "Tenant One",
  "phone": "01700000000",
  "flatNo": "5A",
  "buildingCode": "GREE-AB12",
  "password": "123456",
  "rent": 15000
}
```

Login:

```json
{
  "phone": "01700000000",
  "password": "123456"
}
```
