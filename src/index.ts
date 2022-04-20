import { Convert, PriceFeed as JsonPriceFeed } from "./schemas/PriceFeed";

export type UnixTimestamp = number;
export type HexString = string;

/**
 * A Pyth Price represented as `${price} ± ${conf} * 10^${expo}
 */
export type Price = {
  price: string;
  conf: string;
  expo: number;
};

/**
 * Status of price (Trading is valid).
 *
 * Represents availability status of a price feed.
 */
export enum PriceStatus {
  Auction = "Auction",
  Halted = "Halted",
  Trading = "Trading",
  Unknown = "Unknown",
}

/**
 * Pyth Price Feed
 *
 * Represents a current aggregation price from pyth publisher feeds.
 */

export class PriceFeed {
  /**
   * Confidence interval around the current aggregation price.
   */
  private conf: string;
  /**
   * Exponentially moving average confidence interval.
   */
  private emaConf: string;
  /**
   * Exponentially moving average price.
   */
  private emaPrice: string;
  /**
   * Price exponent.
   */
  expo: number;
  /**
   * Unique identifier for this price.
   */
  id: HexString;
  /**
   * Maximum number of allowed publishers that can contribute to a price.
   */
  maxNumPublishers: number;
  /**
   * Number of publishers that made up current aggregate.
   */
  numPublishers: number;
  /**
   * Confidence interval of previous aggregate with Trading status.
   */
  private prevConf: string;
  /**
   * Price of previous aggregate with Trading status.
   */
  private prevPrice: string;
  /**
   * Publish time of previous aggregate with Trading status.
   */
  private prevPublishTime: UnixTimestamp;
  /**
   * The current aggregation price.
   */
  private price: string;
  /**
   * Product account key.
   */
  productId: HexString;
  /**
   * Current price aggregation publish time
   */
  publishTime: UnixTimestamp;
  /**
   * Status of price (Trading is valid).
   */
  status: PriceStatus;

  constructor(
    conf: string,
    emaConf: string,
    emaPrice: string,
    expo: number,
    id: HexString,
    maxNumPublishers: number,
    numPublishers: number,
    prevConf: string,
    prevPrice: string,
    prevPublishTime: UnixTimestamp,
    price: string,
    productId: HexString,
    publishTime: UnixTimestamp,
    status: PriceStatus
  ) {
    this.conf = conf;
    this.emaConf = emaConf;
    this.emaPrice = emaPrice;
    this.expo = expo;
    this.id = id;
    this.maxNumPublishers = maxNumPublishers;
    this.numPublishers = numPublishers;
    this.prevConf = prevConf;
    this.prevPrice = prevPrice;
    this.prevPublishTime = prevPublishTime;
    this.price = price;
    this.productId = productId;
    this.publishTime = publishTime;
    this.status = status;
  }

  static fromJson(json: any): PriceFeed {
    const jsonFeed: JsonPriceFeed = Convert.toPriceFeed(json);
    return new PriceFeed(
      jsonFeed.conf,
      jsonFeed.ema_conf,
      jsonFeed.ema_price,
      jsonFeed.expo,
      jsonFeed.id,
      jsonFeed.max_num_publishers,
      jsonFeed.num_publishers,
      jsonFeed.prev_conf,
      jsonFeed.prev_price,
      jsonFeed.prev_publish_time,
      jsonFeed.price,
      jsonFeed.product_id,
      jsonFeed.publish_time,
      jsonFeed.status
    );
  }

  toJson(): any {
    const jsonFeed: JsonPriceFeed = {
      conf: this.conf,
      ema_conf: this.emaConf,
      ema_price: this.emaPrice,
      expo: this.expo,
      id: this.id,
      max_num_publishers: this.maxNumPublishers,
      num_publishers: this.numPublishers,
      prev_conf: this.prevConf,
      prev_price: this.prevPrice,
      prev_publish_time: this.prevPublishTime,
      price: this.price,
      product_id: this.productId,
      publish_time: this.publishTime,
      status: this.status
    }
    return Convert.priceFeedToJson(jsonFeed);
  }

  getCurrentPrice(): Price | undefined {
    if (this.status !== PriceStatus.Trading) {
      return undefined;
    }
    return {
      price: this.price,
      conf: this.conf,
      expo: this.expo,
    };
  }

  getEmaPrice(): Price | undefined {
    return {
      price: this.emaPrice,
      conf: this.emaConf,
      expo: this.expo,
    };
  }

  getPrevPriceUnchecked(): [Price, UnixTimestamp] {
    return [
      {
        price: this.prevPrice,
        conf: this.prevConf,
        expo: this.expo,
      },
      this.prevPublishTime,
    ];
  }
}
