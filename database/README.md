# SADAF | Art & Fashion House — Database Documentation

## مقدمة

منصة SADAF بتستخدم Supabase كـ backend وقاعدة بيانات، وده بيوفرلنا PostgreSQL database جاهزة مع API تلقائية وStorage للصور وAuthentication.

القاعدة مقسمة لـ 17 جدول بيغطوا كل خصائص المنصة من متجر وفنون وأزياء مخصصة وAI.

---

## الجداول

### 1. customers — العملاء
بيحفظ بيانات كل عميل على المنصة.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد تلقائي |
| name | TEXT | اسم العميل |
| email | TEXT | البريد الإلكتروني |
| phone | TEXT | رقم الهاتف |
| created_at | TIMESTAMPTZ | تاريخ التسجيل |

---

### 2. measurements — المقاسات
بيحفظ مقاسات جسم العميل عشان يُستخدم في الـ Atelier وMaqasaq AI.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| height | NUMERIC | الطول بالسم |
| weight | NUMERIC | الوزن بالكيلو |
| shoulder | NUMERIC | عرض الكتف |
| chest | NUMERIC | محيط الصدر |
| waist | NUMERIC | محيط الخصر |
| hip | NUMERIC | محيط الورك |

---

### 3. ai_studio — جلسات الـ AI Studio
بيحفظ كل تصميم اتعمل من خلال الـ AI Studio.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| prompt | TEXT | النص اللي كتبه العميل |
| image_url | TEXT | رابط الصورة الناتجة |
| style | TEXT | النمط المختار |
| created_at | TIMESTAMPTZ | تاريخ الجلسة |

---

### 4. ai_fitting_room — غرفة القياس الافتراضية
بيحفظ جلسات التجربة الافتراضية للملابس.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| measurement_id | UUID | مرتبط بجدول measurements |
| ai_studio_id | UUID | مرتبط بجدول ai_studio (اختياري) |
| result_image_url | TEXT | صورة نتيجة التجربة |
| created_at | TIMESTAMPTZ | تاريخ الجلسة |

---

### 5. atelier_orders — طلبات الأزياء المخصصة
بيحفظ الطلبات الخاصة بالتصميم المخصص من الـ Atelier.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| measurement_id | UUID | مرتبط بجدول measurements |
| ai_studio_id | UUID | التصميم المختار من الـ AI (اختياري) |
| employee_id | UUID | الموظف المسؤول عن الطلب |
| coupon_id | UUID | الكوبون المستخدم (اختياري) |
| fabric | TEXT | نوع القماش المختار |
| colors | TEXT | الألوان المختارة |
| notes | TEXT | ملاحظات العميل |
| status | TEXT | حالة الطلب: pending / confirmed / in_progress / ready / delivered / cancelled |
| created_at | TIMESTAMPTZ | تاريخ الطلب |
| updated_at | TIMESTAMPTZ | آخر تحديث |

---

### 6. products — المنتجات والأعمال الفنية
الجدول الرئيسي اللي بيحفظ كل المنتجات والأعمال الفنية.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| name | TEXT | اسم المنتج |
| description | TEXT | وصف تفصيلي |
| price | NUMERIC | السعر |
| category | TEXT | الفئة |
| image_url | TEXT | رابط الصورة الرئيسية |
| hover_image | TEXT | رابط صورة الـ hover |
| in_stock | BOOLEAN | متوفر أم لا |
| fabric | TEXT | نوع القماش (للأزياء) |
| sizes | TEXT[] | المقاسات المتاحة |
| colors | JSONB | الألوان المتاحة |
| rating | NUMERIC | التقييم |
| artist | TEXT | اسم الفنان (للأعمال الفنية) |
| medium | TEXT | الخامة المستخدمة |
| dimensions | TEXT | الأبعاد |
| year | TEXT | سنة الإنتاج |
| created_at | TIMESTAMPTZ | تاريخ الإضافة |

#### Categories المتاحة
**أزياء:**
- Traditional Fusion
- Women
- Men
- Kids
- Limited Edition

**فنون:**
- Art - Calligraphy
- Art - Handmade
- Art - Oil Paintings
- Art - Digital Art
- Art - Fashion Sketches

---

### 7. orders — الطلبات العامة
بيحفظ طلبات الشراء من المتجر.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| coupon_id | UUID | الكوبون المستخدم (اختياري) |
| total_price | NUMERIC | السعر الإجمالي |
| status | TEXT | حالة الطلب: pending / confirmed / shipped / delivered / cancelled |
| created_at | TIMESTAMPTZ | تاريخ الطلب |
| updated_at | TIMESTAMPTZ | آخر تحديث |

---

### 8. order_items — تفاصيل الطلبات
بيحفظ المنتجات الموجودة داخل كل طلب.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| order_id | UUID | مرتبط بجدول orders |
| product_id | UUID | مرتبط بجدول products |
| quantity | INT | الكمية |
| unit_price | NUMERIC | سعر الوحدة وقت الشراء |

---

### 9. messages — رسائل الـ Chatbot
بيحفظ المحادثات بين العميل والـ chatbot.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| message | TEXT | رسالة العميل |
| response | TEXT | رد الـ chatbot |
| created_at | TIMESTAMPTZ | تاريخ الرسالة |

---

### 10. employees — الموظفين
بيحفظ بيانات موظفي الورشة والـ atelier.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| name | TEXT | اسم الموظف |
| role | TEXT | الدور الوظيفي |
| email | TEXT | البريد الإلكتروني |
| phone | TEXT | رقم الهاتف |
| is_active | BOOLEAN | نشط أم لا |
| created_at | TIMESTAMPTZ | تاريخ الانضمام |

---

### 11. payments — المدفوعات
بيحفظ عمليات الدفع المرتبطة بالطلبات.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| order_id | UUID | مرتبط بجدول orders (اختياري) |
| atelier_order_id | UUID | مرتبط بجدول atelier_orders (اختياري) |
| amount | NUMERIC | المبلغ المدفوع |
| method | TEXT | طريقة الدفع: card / cash / wallet / bank_transfer |
| status | TEXT | حالة الدفع: pending / paid / failed / refunded |
| transaction_ref | TEXT | رقم مرجعي للعملية |
| paid_at | TIMESTAMPTZ | تاريخ الدفع |

---

### 12. shipping — الشحن والتوصيل
بيتابع حالة الشحن لكل طلب.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| order_id | UUID | مرتبط بجدول orders (اختياري) |
| atelier_order_id | UUID | مرتبط بجدول atelier_orders (اختياري) |
| carrier | TEXT | شركة الشحن |
| tracking_number | TEXT | رقم التتبع |
| status | TEXT | حالة الشحن: pending / shipped / out_for_delivery / delivered / returned |
| address | TEXT | عنوان التوصيل |
| shipped_at | TIMESTAMPTZ | تاريخ الشحن |
| delivered_at | TIMESTAMPTZ | تاريخ الاستلام |

---

### 13. coupons — الكوبونات
بيحفظ كوبونات الخصم.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| code | TEXT | كود الكوبون |
| type | TEXT | نوع الخصم: percentage / fixed |
| value | NUMERIC | قيمة الخصم |
| min_order | NUMERIC | الحد الأدنى للطلب |
| max_uses | INT | الحد الأقصى للاستخدام |
| used_count | INT | عدد مرات الاستخدام |
| expires_at | TIMESTAMPTZ | تاريخ انتهاء الصلاحية |
| is_active | BOOLEAN | نشط أم لا |

---

### 14. coupon_usage — استخدام الكوبونات
بيتتبع استخدام الكوبونات لمنع الاستخدام المكرر.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| coupon_id | UUID | مرتبط بجدول coupons |
| customer_id | UUID | مرتبط بجدول customers |
| order_id | UUID | مرتبط بجدول orders (اختياري) |
| used_at | TIMESTAMPTZ | تاريخ الاستخدام |

---

### 15. reviews — التقييمات
بيحفظ تقييمات العملاء للمنتجات.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| product_id | UUID | مرتبط بجدول products |
| rating | INT | التقييم من 1 لـ 5 |
| comment | TEXT | تعليق العميل |
| created_at | TIMESTAMPTZ | تاريخ التقييم |

---

### 16. wishlist — المفضلة
بيحفظ المنتجات المحفوظة في قائمة المفضلة.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| product_id | UUID | مرتبط بجدول products |
| added_at | TIMESTAMPTZ | تاريخ الإضافة |

---

### 17. notifications — الإشعارات
بيحفظ الإشعارات المرسلة للعملاء.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | معرف فريد |
| customer_id | UUID | مرتبط بجدول customers |
| type | TEXT | نوع الإشعار |
| title | TEXT | عنوان الإشعار |
| body | TEXT | محتوى الإشعار |
| is_read | BOOLEAN | تم قراءته أم لا |
| created_at | TIMESTAMPTZ | تاريخ الإشعار |

---

## Security

- RLS مفعّل على جدول products مع policy للقراءة العامة
- باقي الجداول محمية وبتحتاج authentication
- الصور محفوظة على Supabase Storage

---

## Stack

- **Database:** PostgreSQL via Supabase
- **Client:** @supabase/supabase-js
- **Storage:** Supabase Storage للصور