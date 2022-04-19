import { Price, PriceFeed, PriceStatus, UnixTimestamp } from "../index";

test("Parsing Price Feed works as expected", () => {
  const data = {
    conf: "1",
    ema_conf: "2",
    ema_price: "3",
    expo: 4,
    id: "abcdef0123456789",
    max_num_publishers: 6,
    num_publishers: 5,
    prev_conf: "7",
    prev_price: "8",
    prev_publish_time: 9,
    price: "10",
    product_id: "0123456789abcdef",
    publish_time: 11,
    status: PriceStatus.Trading,
  };

  const priceFeed = new PriceFeed(data);
  expect(priceFeed.status).toBe(PriceStatus.Trading);
  expect(priceFeed.expo).toBe(4);
  expect(priceFeed.id).toBe("abcdef0123456789");
  expect(priceFeed.maxNumPublishers).toBe(6);
  expect(priceFeed.numPublishers).toBe(5);
  expect(priceFeed.productId).toBe("0123456789abcdef");
  expect(priceFeed.publishTime).toBe(11);
  expect(priceFeed.getCurrentPrice()).toStrictEqual<Price>({
    conf: "1",
    price: "10",
    expo: 4,
  });
  expect(priceFeed.getEmaPrice()).toStrictEqual<Price>({
    conf: "2",
    price: "3",
    expo: 4,
  });
  expect(priceFeed.getPrevPriceUnchecked()).toStrictEqual<
    [Price, UnixTimestamp]
  >([{ conf: "7", price: "8", expo: 4 }, 9]);
});

test("getCurrentPrice returns undefined if status is not Trading", () => {
  const data = {
    conf: "1",
    ema_conf: "2",
    ema_price: "3",
    expo: 4,
    id: "abcdef0123456789",
    max_num_publishers: 6,
    num_publishers: 5,
    prev_conf: "7",
    prev_price: "8",
    prev_publish_time: 9,
    price: "10",
    product_id: "0123456789abcdef",
    publish_time: 11,
    status: PriceStatus.Unknown,
  };

  const priceFeed = new PriceFeed(data);
  expect(priceFeed.getCurrentPrice()).toBeUndefined();
});
