import { api } from "./api";

const qs = (params?: Record<string, string | number | boolean | undefined>) => {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!entries.length) return "";
  const query = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
  return query ? `?${query}` : "";
};

export const businessService = {
  list: () => api.get("business", { auth: true }),
  get: (id: string | number) => api.get(`business/${id}`, { auth: true }),
  create: (data: unknown) => api.post("business", data, { auth: true }),
  update: (id: string | number, data: unknown) =>
    api.put(`business/${id}`, data, { auth: true }),
  remove: (id: string | number) => api.delete(`business/${id}`, { auth: true }),
  createWithLogo: (payload: {
    name: string;
    brand_name: string;
    primary_color?: string;
    secondary_color?: string;
    logo?: File | Blob;
  }) => {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("brand_name", payload.brand_name);
    if (payload.primary_color)
      form.append("primary_color", payload.primary_color);
    if (payload.secondary_color)
      form.append("secondary_color", payload.secondary_color);
    if (payload.logo) form.append("logo", payload.logo);
    return api.postForm("business", form, { auth: true });
  },
  updateWithLogo: (
    id: string | number,
    payload: {
      name?: string;
      brand_name?: string;
      primary_color?: string;
      secondary_color?: string;
      logo?: File | Blob | null;
    },
  ) => {
    const form = new FormData();
    if (payload.name) form.append("name", payload.name);
    if (payload.brand_name) form.append("brand_name", payload.brand_name);
    if (payload.primary_color)
      form.append("primary_color", payload.primary_color);
    if (payload.secondary_color)
      form.append("secondary_color", payload.secondary_color);
    if (payload.logo) form.append("logo", payload.logo);
    return api.putForm(`business/${id}`, form, { auth: true });
  },
};

export const userService = {
  list: () => api.get("users", { auth: true }),
  listByBusiness: (businessId: string | number) =>
    api.get(`users/business/${businessId}`, { auth: true }),
  listAdminsOwners: (params?: { business_id?: string | number }) =>
    api.get(`users/admins-owners${qs(params)}`, { auth: true }),
  get: (id: string | number) => api.get(`users/${id}`, { auth: true }),
  create: (data: unknown) => api.post("users", data, { auth: true }),
  update: (id: string | number, data: unknown) =>
    api.put(`users/${id}`, data, { auth: true }),
  remove: (id: string | number, params?: { business_id?: string | number }) =>
    api.delete(`users/${id}${qs(params)}`, { auth: true }),
  updatePassword: (
    id: string | number,
    data: { password: string },
    params?: { business_id?: string | number },
  ) => api.patch(`users/${id}/password${qs(params)}`, data, { auth: true }),
};

export const categoryService = {
  list: () => api.get("categories", { auth: true }),
  listByOwner: () => api.get("categories/owner", { auth: true }),
  get: (id: string | number) => api.get(`categories/${id}`, { auth: true }),
  create: (data: unknown) => api.post("categories", data, { auth: true }),
  createBulk: (data: unknown) =>
    api.post("categories/bulk", data, { auth: true }),
  update: (id: string | number, data: unknown) =>
    api.put(`categories/${id}`, data, { auth: true }),
  remove: (id: string | number) =>
    api.delete(`categories/${id}`, { auth: true }),
};

export const productService = {
  list: (params?: { category_id?: string | number; status?: string }) =>
    api.get(`products${qs(params)}`, { auth: true }),
  listByOwner: (params?: {
    business_id?: string | number;
    category_id?: string | number;
    status?: string;
  }) => api.get(`products/owner${qs(params)}`, { auth: true }),
  get: (id: string | number) => api.get(`products/${id}`, { auth: true }),
  create: (data: unknown) => api.post("products", data, { auth: true }),
  createWithImage: (payload: {
    name: string;
    description?: string;
    price: string | number;
    category_id: string | number;
    status?: string;
    options?: string;
    business_id?: string | number;
    image?: File | Blob;
  }) => {
    const form = new FormData();
    form.append("name", payload.name);
    if (payload.description) form.append("description", payload.description);
    form.append("price", String(payload.price));
    form.append("category_id", String(payload.category_id));
    if (payload.status) form.append("status", payload.status);
    if (payload.options) form.append("options", payload.options);
    if (payload.business_id)
      form.append("business_id", String(payload.business_id));
    if (payload.image) form.append("image", payload.image);
    return api.postForm("products", form, { auth: true });
  },
  createBulkWithImage: (payload: {
    name: string;
    description?: string;
    price: string | number;
    category_id: string | number;
    status?: string;
    options?: string;
    business_ids: Array<string | number>;
    image?: File | Blob;
  }) => {
    const form = new FormData();
    form.append("name", payload.name);
    if (payload.description) form.append("description", payload.description);
    form.append("price", String(payload.price));
    form.append("category_id", String(payload.category_id));
    if (payload.status) form.append("status", payload.status);
    if (payload.options) form.append("options", payload.options);
    form.append(
      "business_ids",
      JSON.stringify(payload.business_ids.map((b) => Number(b))),
    );
    if (payload.image) form.append("image", payload.image);
    return api.postForm("products/bulk", form, { auth: true });
  },
  update: (id: string | number, data: unknown) =>
    api.put(`products/${id}`, data, { auth: true }),
  updateStatus: (id: string | number, data: unknown) =>
    api.post(`products/${id}/status`, data, { auth: true }),
  remove: (id: string | number) => api.delete(`products/${id}`, { auth: true }),
  addOption: (id: string | number, data: unknown) =>
    api.post(`products/${id}/options`, data, { auth: true }),
  updateOption: (optionId: string | number, data: unknown) =>
    api.put(`product-options/${optionId}`, data, { auth: true }),
  removeOption: (optionId: string | number) =>
    api.delete(`product-options/${optionId}`, { auth: true }),
};

export const promotionService = {
  list: (params?: { active?: boolean }) =>
    api.get(`promotions${qs(params)}`, { auth: true }),
  listByBusiness: (businessIds: Array<string | number>) =>
    api.get(`promotions/by-business${qs({ business_ids: businessIds.join(",") })}`, {
      auth: true,
    }),
  get: (id: string | number) => api.get(`promotions/${id}`, { auth: true }),
  create: (data: unknown) => api.post("promotions", data, { auth: true }),
  update: (id: string | number, data: unknown) =>
    api.put(`promotions/${id}`, data, { auth: true }),
  toggleActive: (id: string | number, data: unknown) =>
    api.post(`promotions/${id}/active`, data, { auth: true }),
  addProducts: (id: string | number, data: unknown) =>
    api.post(`promotions/${id}/products`, data, { auth: true }),
  removeProducts: (id: string | number) =>
    api.delete(`promotions/${id}/products`, { auth: true }),
  remove: (id: string | number) =>
    api.delete(`promotions/${id}`, { auth: true }),
};

export const locationService = {
  list: () => api.get("/locations", { auth: true }),
  create: (data: unknown) => api.post("/locations", data, { auth: true }),
};

export const eventService = {
  list: (params?: { future?: boolean }) =>
    api.get(`/events${qs(params)}`, { auth: true }),
  get: (id: string | number) => api.get(`/events/${id}`, { auth: true }),
  create: (data: unknown) => api.post("/events", data, { auth: true }),
};

export const orderService = {
  list: (params?: {
    status?: string;
    order_source?: string;
    customer_id?: string | number;
  }) => api.get(`/orders${qs(params)}`, { auth: true }),
  get: (id: string | number) => api.get(`/orders/${id}`, { auth: true }),
  create: (data: unknown) => api.post("/orders", data, { auth: true }),
  updateStatus: (id: string | number, data: unknown) =>
    api.post(`/orders/${id}/status`, data, { auth: true }),
  remove: (id: string | number) => api.delete(`/orders/${id}`, { auth: true }),
};

export const paymentService = {
  create: (data: unknown) => api.post("/payments", data, { auth: true }),
  getByOrder: (orderId: string | number) =>
    api.get(`/payments/${orderId}`, { auth: true }),
};

export const paymentConfigService = {
  listActive: () => api.get("/payment-configs", { auth: true }),
  create: (data: unknown) => api.post("/payment-configs", data, { auth: true }),
};

export const customerService = {
  sendOtp: (data: unknown) => api.post("/customers/otp/send", data),
  verifyOtp: (data: unknown) => api.post("/customers/otp/verify", data),
  list: (params?: { business_id?: string | number }) =>
    api.get(`/customers${qs(params)}`),
  get: (id: string | number, params?: { business_id?: string | number }) =>
    api.get(`/customers/${id}${qs(params)}`),
  update: (id: string | number, data: unknown) =>
    api.put(`/customers/${id}`, data),
  remove: (id: string | number) => api.delete(`/customers/${id}`),

  // Direcciones
  listAddresses: (customerId: string | number) =>
    api.get(`/customers/${customerId}/addresses`),
  getAddress: (customerId: string | number, addressId: string | number) =>
    api.get(`/customers/${customerId}/addresses/${addressId}`),
  createAddress: (customerId: string | number, data: unknown) =>
    api.post(`/customers/${customerId}/addresses`, data),
  updateAddress: (
    customerId: string | number,
    addressId: string | number,
    data: unknown,
  ) => api.put(`/customers/${customerId}/addresses/${addressId}`, data),
  updateAddressById: (id: string | number, data: unknown) =>
    api.put(`/customers/addresses/${id}`, data),
  removeAddress: (customerId: string | number, addressId: string | number) =>
    api.delete(`/customers/${customerId}/addresses/${addressId}`),
};
