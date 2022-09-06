import { Price, PriceFeed, PriceFeedMetadata, PriceStatus } from "../index";

beforeAll(() => {
  jest.useFakeTimers();
});

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

  const priceFeed = PriceFeed.fromJson(data);
  expect(priceFeed.status).toBe(PriceStatus.Trading);
  expect(priceFeed.expo).toBe(4);
  expect(priceFeed.id).toBe("abcdef0123456789");
  expect(priceFeed.maxNumPublishers).toBe(6);
  expect(priceFeed.numPublishers).toBe(5);
  expect(priceFeed.productId).toBe("0123456789abcdef");
  expect(priceFeed.publishTime).toBe(11);
  expect(priceFeed.getCurrentPrice()).toStrictEqual(new Price("1", 4, "10"));
  expect(priceFeed.getEmaPrice()).toStrictEqual(new Price("2", 4, "3"));
  expect(priceFeed.getLatestAvailablePriceUnchecked()).toStrictEqual([
    new Price("1", 4, "10"),
    11,
  ]);

  jest.setSystemTime(20000);
  expect(priceFeed.getLatestAvailablePriceWithinDuration(15)).toStrictEqual(
    new Price("1", 4, "10")
  );
  expect(priceFeed.getLatestAvailablePriceWithinDuration(5)).toBeUndefined();
  expect(priceFeed.toJson()).toEqual(data);
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

  const priceFeed = PriceFeed.fromJson(data);
  expect(priceFeed.getCurrentPrice()).toBeUndefined();
});

test("getLatestAvailablePrice returns prevPrice when status is not Trading", () => {
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

  const priceFeed = PriceFeed.fromJson(data);

  expect(priceFeed.getLatestAvailablePriceUnchecked()).toStrictEqual([
    new Price("7", 4, "8"),
    9,
  ]);

  jest.setSystemTime(20000);
  expect(priceFeed.getLatestAvailablePriceWithinDuration(15)).toStrictEqual(
    new Price("7", 4, "8")
  );
  expect(priceFeed.getLatestAvailablePriceWithinDuration(10)).toBeUndefined();
});

test("getMetadata returns PriceFeedMetadata as expected", () => {
  const data = {
    conf: "1",
    ema_conf: "2",
    ema_price: "3",
    expo: 4,
    id: "abcdef0123456789",
    max_num_publishers: 6,
    metadata: new PriceFeedMetadata({
      attestation_time: 7,
      emitter_chain: 8,
      sequence_number: 9,
    }),
    num_publishers: 10,
    prev_conf: "11",
    prev_price: "12",
    prev_publish_time: 13,
    price: "14",
    product_id: "0123456789abcdef",
    publish_time: 16,
    status: PriceStatus.Unknown,
  };

  const priceFeed = PriceFeed.fromJson(data);

  expect(priceFeed.getMetadata()).toStrictEqual(
    new PriceFeedMetadata({
      attestation_time: 7,
      emitter_chain: 8,
      sequence_number: 9,
    })
  );
});
