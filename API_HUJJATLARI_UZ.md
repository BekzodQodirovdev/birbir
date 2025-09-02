# Frontend Integratsiyasi uchun API Hujjatlari

## Kirish

Bu hujjat frontend dasturchilari uchun Bir Bir API bilan integratsiya qilish bo'yicha to'liq yo'riqnoma beradi. Bu NestJS asosidagi backend API bo'lib, mahsulot ro'yxatlari, foydalanuvchi boshqaruvi, Telegram orqali autentifikatsiya va boshqa xususiyatlarni o'z ichiga oladi.

## Asosiy URL va Sozlash

- **Asosiy URL**: `http://localhost:4000/api` (mahalliy ishlab chiqish uchun)
- **Global Prefiks**: Barcha endpointlar `/api` prefiksi bilan boshlanadi
- **CORS**: Barcha manbalardan (`*`) ruxsat berilgan
- **Tezlik Cheklovi**: Sekundiga 3 ta so'rov (qisqa vaqt oralig'i)
- **Autentifikatsiya**: Himoyalangan endpointlar uchun JWT Bearer tokenlari talab qilinadi
- **API Hujjatlari**: Swagger UI `/api/docs` manzilida mavjud

## Autentifikatsiya

API Telegram asosidagi autentifikatsiyadan foydalanadi. Frontenddan autentifikatsiyani qanday boshqarish kerak:

### 1. Telegram Autentifikatsiya Jarayoni

#### 1-qadam: Sessiya Yaratish

**Endpoint**: `GET /api/auth/telegram/session`
**Tavsif**: Telegram autentifikatsiya jarayoni uchun sessiya tokenini yaratadi
**Javob**:

```json
{
  "sessionToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2-qadam: Autentifikatsiyani Yakunlash

**Endpoint**: `POST /api/auth/telegram/complete`
**Tavsif**: Telegram autentifikatsiya jarayonini yakunlaydi
**So'rov Tana**:

```json
{
  "sessionToken": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "phone": "+998901234567",
  "telegramId": "123456789",
  "username": "johndoe",
  "photo": "https://example.com/photo.jpg"
}
```

**Javob**:

```json
{
  "status": "success",
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3-qadam: JWT Tokenni Saqlash

Keyingi so'rovlar uchun JWT tokenni localStorage yoki xavfsiz cookie'da saqlang.

### Frontend Autentifikatsiya Misoli

```javascript
// 1. Sessiya yaratish
const sessionResponse = await fetch('/api/auth/telegram/session');
const { sessionToken } = await sessionResponse.json();

// 2. Autentifikatsiyani yakunlash (Telegram logindan keyin)
const completeResponse = await fetch('/api/auth/telegram/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionToken,
    name: userData.name,
    phone: userData.phone,
    telegramId: userData.telegramId,
    username: userData.username,
    photo: userData.photo,
  }),
});

const { jwt } = await completeResponse.json();
localStorage.setItem('authToken', jwt);
```

### JWT Tokenni So'rovlarda Ishlatish

Himoyalangan endpointlar uchun Authorization header'iga JWT tokenni qo'shing:

```javascript
const response = await fetch('/api/products', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});
```

## API Endpointlari

### Mahsulotlar

#### Barcha Mahsulotlarni Olish

**Endpoint**: `GET /api/products`
**Usul**: GET
**Tavsif**: Barcha faol mahsulotlarni pagination bilan oladi
**Query Parametrlari**:

- `page` (number): Sahifa raqami (standart: 1)
- `limit` (number): Sahifadagi elementlar soni (standart: 10)
  **Javob**:

```json
{
  "data": [
    {
      "id": "product-id",
      "name": "Mahsulot Nomi",
      "description": "Mahsulot tavsifi",
      "price": 100,
      "stock": 5,
      "condition": "new",
      "is_negotiable": true,
      "is_urgent": false,
      "is_free": false,
      "has_delivery": true,
      "category": "Elektronika",
      "location": "Toshkent",
      "latitude": 41.2995,
      "longitude": 69.2401,
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### Mahsulotlarni Qidirish

**Endpoint**: `GET /api/products/search`
**Usul**: GET
**Query Parametrlari**:

- `q` (string): Qidiruv so'rovi
- `page` (number): Sahifa raqami
- `limit` (number): Sahifadagi elementlar soni
  **Misol**: `/api/products/search?q=laptop&page=1&limit=10`

#### ID bo'yicha Mahsulotni Olish

**Endpoint**: `GET /api/products/:id`
**Usul**: GET
**Javob**: Bitta mahsulot obyekti

#### Mahsulot Yaratish

**Endpoint**: `POST /api/products`
**Usul**: POST
**Headerlar**: `Authorization: Bearer <token>`
**So'rov Tana** (barcha maydonlar ixtiyoriy deb belgilanganlardan tashqari majburiy):

```json
{
  "name": "iPhone 13", // string, majburiy
  "description": "Eng so'nggi iPhone modeli", // string, ixtiyoriy
  "price": 999, // number, majburiy, minimum 0
  "stock": 1, // number, majburiy, minimum 0
  "image_url": "https://example.com/image.jpg", // string, ixtiyoriy
  "condition": "new", // enum: "new" | "used", ixtiyoriy
  "is_negotiable": true, // boolean, ixtiyoriy (narx kelishiladimi)
  "is_urgent": false, // boolean, ixtiyoriy (tez sotiladimi)
  "is_free": false, // boolean, ixtiyoriy
  "has_delivery": true, // boolean, ixtiyoriy (yetkazib berish mavjudmi)
  "category": "Elektronika", // string, ixtiyoriy
  "subcategory": "Smartfonlar", // string, ixtiyoriy
  "location": "Toshkent", // string, ixtiyoriy
  "latitude": 41.2995, // number, ixtiyoriy, to'g'ri latitude bo'lishi kerak
  "longitude": 69.2401, // number, ixtiyoriy, to'g'ri longitude bo'lishi kerak
  "is_active": true, // boolean, ixtiyoriy
  "slug": "iphone-13", // string, ixtiyoriy
  "status": 1, // number, ixtiyoriy
  "tab": "active", // string, ixtiyoriy
  "should_expired_at": "2023-12-31T23:59:59Z", // string, ixtiyoriy
  "first_published_at": "2023-01-01T00:00:00Z", // string, ixtiyoriy
  "publishable": true, // boolean, ixtiyoriy
  "issues": null, // string, ixtiyoriy
  "uuid": "550e8400-e29b-41d4-a716-446655440000", // string, ixtiyoriy, UUID bo'lishi kerak
  "web_uri": "https://example.com/product/iphone-13", // string, ixtiyoriy
  "payload": "{}", // string, ixtiyoriy
  "promotion_data": "{}", // string, ixtiyoriy
  "statistics": "{}", // string, ixtiyoriy
  "notice_top": "Yuqori ogohlantirish", // string, ixtiyoriy
  "notice_bottom": "Pastki ogohlantirish", // string, ixtiyoriy
  "delivery_enabled": true, // boolean, ixtiyoriy
  "gross_price": 999, // number, ixtiyoriy
  "gross_price_discount": 0, // number, ixtiyoriy
  "badges": "new,urgent" // string, ixtiyoriy
}
```

**Javob**: Yaratilgan mahsulot obyekti

#### Mahsulotni Yangilash

**Endpoint**: `PATCH /api/products/:id`
**Usul**: PATCH
**Headerlar**: `Authorization: Bearer <token>`
**So'rov Tana**: Yaratishdagidek, lekin barcha maydonlar ixtiyoriy
**Javob**: Yangilangan mahsulot obyekti

#### Mahsulotni O'chirish

**Endpoint**: `DELETE /api/products/:id`
**Usul**: DELETE
**Headerlar**: `Authorization: Bearer <token>`
**Javob**: Muvaffaqiyat xabari

#### Mahsulot Rasmlarini Yuklash

**Endpoint**: `POST /api/products/:id/images`
**Usul**: POST
**Headerlar**:

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`
  **Tana**: `images` maydoni bilan FormData (6 tagacha rasm, har biri maksimum 10MB)
  **Javob**: Yuklangan rasmlar ma'lumotlari

#### Mahsulotga Like Qo'yish

**Endpoint**: `POST /api/products/:id/like`
**Usul**: POST
**Headerlar**: `Authorization: Bearer <token>`
**Javob**: Muvaffaqiyat xabari

### Foydalanuvchilar

#### Joriy Foydalanuvchi Profiling Olish

**Endpoint**: `GET /api/users/profile`
**Usul**: GET
**Headerlar**: `Authorization: Bearer <token>`
**Javob**:

```json
{
  "id": "user-id",
  "name": "John Doe",
  "phone_number": "+998901234567",
  "picture": "https://example.com/photo.jpg",
  "is_active": true,
  "role": "user",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### Foydalanuvchi Profiling Yangilash

**Endpoint**: `PATCH /api/users/:id`
**Usul**: PATCH
**Headerlar**: `Authorization: Bearer <token>`
**So'rov Tana** (barcha maydonlar ixtiyoriy):

```json
{
  "name": "Yangilangan Ism", // string, ixtiyoriy
  "phone_number": "+998901234567", // string, ixtiyoriy
  "picture": "https://example.com/new-photo.jpg", // string, ixtiyoriy
  "is_active": true, // boolean, ixtiyoriy
  "role": "user" // enum: "user" | "admin", ixtiyoriy
}
```

**Javob**: Yangilangan foydalanuvchi obyekti

#### Foydalanuvchi Yaratish (Faqat Admin)

**Endpoint**: `POST /api/users`
**Usul**: POST
**Headerlar**: `Authorization: Bearer <token>` (admin roli kerak)
**So'rov Tana**:

```json
{
  "name": "Yangi Foydalanuvchi", // string, majburiy
  "phone_number": "+998901234567", // string, majburiy
  "picture": "https://example.com/photo.jpg", // string, ixtiyoriy
  "is_active": true, // boolean, ixtiyoriy
  "role": "user" // enum: "user" | "admin", ixtiyoriy, standart "user"
}
```

### Hududlar

#### Barcha Hududlarni Olish

**Endpoint**: `GET /api/regions`
**Usul**: GET
**Javob**: Hududlar massivi

#### ID bo'yicha Hududni Olish

**Endpoint**: `GET /api/regions/:id`
**Usul**: GET
**Javob**: Bitta hudud obyekti

## Xatoliklarni Boshqarish

API standart HTTP status kodlarini qaytaradi:

- `200`: Muvaffaqiyat
- `201`: Yaratildi
- `400`: Noto'g'ri So'rov (validatsiya xatoliklari)
- `401`: Avtorizatsiyadan o'tmagan (token yo'q yoki noto'g'ri)
- `403`: Taqiqlangan (yetarli huquqlar yo'q)
- `404`: Topilmadi
- `500`: Ichki Server Xatosi

Xatolik javobi formati:

```json
{
  "statusCode": 400,
  "message": "Validatsiya muvaffaqiyatsiz",
  "error": "Bad Request"
}
```

Yoki validatsiya xatoliklari uchun:

```json
{
  "statusCode": 400,
  "message": ["name string bo'lishi kerak", "price number bo'lishi kerak"],
  "error": "Bad Request"
}
```

## Frontend Integratsiyasi Misollari

### Fetch API dan Foydalanish

```javascript
// GET so'rovi
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products?page=1&limit=10', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP xatolik! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Mahsulotlarni olishda xatolik:', error);
  }
};

// POST so'rovi
const createProduct = async (productData) => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`HTTP xatolik! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Mahsulot yaratildi:', data);
  } catch (error) {
    console.error('Mahsulot yaratishda xatolik:', error);
  }
};
```

### Axios dan Foydalanish

```javascript
import axios from 'axios';

// Axios instance sozlash
const api = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  },
});

// GET so'rovi
const fetchProducts = async () => {
  try {
    const response = await api.get('/products', {
      params: { page: 1, limit: 10 },
    });
    console.log(response.data);
  } catch (error) {
    console.error(
      'Mahsulotlarni olishda xatolik:',
      error.response?.data || error.message,
    );
  }
};

// POST so'rovi
const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    console.log('Mahsulot yaratildi:', response.data);
  } catch (error) {
    console.error(
      'Mahsulot yaratishda xatolik:',
      error.response?.data || error.message,
    );
  }
};
```

## Fayl Yuklash

Rasm yuklash uchun FormData dan foydalaning:

```javascript
const uploadImages = async (productId, files) => {
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  try {
    const response = await fetch(`/api/products/${productId}/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP xatolik! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Rasmlar yuklandi:', data);
  } catch (error) {
    console.error('Rasm yuklashda xatolik:', error);
  }
};
```

## Pagination

Ko'pgina ro'yxat endpointlari paginationni qo'llab-quvvatlaydi:

```javascript
// Pagination implementatsiyasi misoli
const loadProducts = async (page = 1, limit = 10) => {
  const response = await fetch(`/api/products?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  const data = await response.json();

  // data struktura:
  // {
  //   data: [...], // mahsulotlar massivi
  //   total: 100,  // umumiy mahsulotlar soni
  //   page: 1,     // joriy sahifa
  //   limit: 10    // sahifadagi elementlar soni
  // }

  return data;
};
```

## WebSocket Qo'llab-quvvatlash

API real-vaqt xususiyatlari uchun WebSocket ulanishlarini qo'llab-quvvatlaydi. Socket.IO klientidan foydalaning:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

// Autentifikatsiya bilan ulanish
socket.emit('authenticate', { token: localStorage.getItem('authToken') });

// Hodisalarni tinglash
socket.on('product:updated', (data) => {
  console.log('Mahsulot yangilandi:', data);
});
```

## Muhit O'zgaruvchilari

Ishlab chiqarishda joylashtirish uchun quyidagi muhit o'zgaruvchilarini o'rnating:

- `PORT`: Server porti (standart: 4000)
- `DB_HOST`: Ma'lumotlar bazasi hosti
- `DB_PORT`: Ma'lumotlar bazasi porti
- `DB_USER`: Ma'lumotlar bazasi foydalanuvchisi
- `DB_PASS`: Ma'lumotlar bazasi paroli
- `DB_NAME`: Ma'lumotlar bazasi nomi
- `FRONTEND_SOCIAL_LOGIN_URL`: Ijtimoiy login uchun frontend URL

## API ni Test Qilish

1. Backend serverni ishga tushiring: `npm run start:dev`
2. Swagger UI ga kiring: `http://localhost:4000/api/docs`
3. Endpointlarni to'g'ridan-to'g'ri brauzerda yoki Postman kabi vositalar bilan test qiling

## Keng Tarqalgan Muammolar va Yechimlar

1. **CORS Xatoliklari**: Frontend API dan farqli portda ishlaganligini ta'minlang
2. **401 Avtorizatsiyadan o'tmagan**: JWT token yaroqli va headerlarda borligini tekshiring
3. **400 Noto'g'ri So'rov**: So'rov tanasini DTO spetsifikatsiyalariga mos ravishda validatsiya qiling
4. **Tezlik Cheklovi**: Tez-tez so'rovlar uchun debouncing implementatsiya qiling
5. **Fayl Yuklash Xatoliklari**: Fayllar o'lcham chegaralaridan oshmagan va to'g'ri formatda ekanligini ta'minlang

## Qo'llab-quvvatlash

Qo'shimcha yordam uchun:

- `/api/docs` da Swagger hujjatlarini tekshiring
- Manba kodini batafsil implementatsiya uchun ko'rib chiqing
- Spetsifik endpointlar bo'yicha backend jamoasi bilan bog'laning

Bu hujjat Bir Bir API bilan integratsiya qilishning asosiy jihatlarini qamrab oladi. Murakkabroq xususiyatlar yoki spetsifik holatlar uchun Swagger hujjatlariga yoki ishlab chiqish jamoasiga murojaat qiling.
