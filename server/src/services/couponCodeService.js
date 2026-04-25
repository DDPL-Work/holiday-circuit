import { randomInt } from "crypto";
import Coupon from "../models/coupon.model.js";
import ApiError from "../utils/ApiError.js";

const COUPON_CODE_CHARSET = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_CODE_LENGTH = 10;
const MAX_GENERATION_ATTEMPTS = 15;

const buildRandomCode = (length = DEFAULT_CODE_LENGTH) => {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    const nextCharacterIndex = randomInt(0, COUPON_CODE_CHARSET.length);
    code += COUPON_CODE_CHARSET[nextCharacterIndex];
  }

  return code;
};

export const generateUniqueCouponCode = async ({
  length = DEFAULT_CODE_LENGTH,
} = {}) => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const nextCode = buildRandomCode(length);
    const existingCoupon = await Coupon.exists({ code: nextCode });

    if (!existingCoupon) {
      return nextCode;
    }
  }

  throw new ApiError(500, "Unable to generate a unique coupon code right now");
};

