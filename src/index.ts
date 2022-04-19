import { Convert, PriceFeed as InternalPriceFeed } from "./schemas/PriceFeed";

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

  constructor(json: any) {
    const feed: InternalPriceFeed = Convert.toPriceFeed(json);
    this.conf = feed.conf;
    this.emaConf = feed.emaConf;
    this.emaPrice = feed.emaPrice;
    this.expo = feed.expo;
    this.id = feed.id;
    this.maxNumPublishers = feed.maxNumPublishers;
    this.numPublishers = feed.numPublishers;
    this.prevConf = feed.prevConf;
    this.prevPrice = feed.prevPrice;
    this.prevPublishTime = feed.prevPublishTime;
    this.price = feed.price;
    this.productId = feed.productId;
    this.publishTime = feed.publishTime;
    this.status = feed.status;
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
