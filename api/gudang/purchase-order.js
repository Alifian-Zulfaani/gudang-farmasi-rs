import request from "utils/request";

export function getPurchaseOrder(params) {
  return request({
    url: `${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL}/purchase-order`,
    method: "GET",
    params,
  });
}

export function getDetailPurchaseOrder(params) {
  return request({
    url: `${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL}/purchase-order/show`,
    method: "GET",
    params,
  });
}