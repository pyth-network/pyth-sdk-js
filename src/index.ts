import { Convert, PriceFeed as JsonPriceFeed } from "./schemas/PriceFeed";

export type UnixTimestamp = number;
export type DurationInSeconds = number;
export type HexString = string;

/**
 * A Pyth Price represented as `${price} ± ${conf} * 10^${expo}
 */
export class Price {
  conf: string;
  expo: number;
  price: string;

  constructor(conf: string, expo: number, price: string) {
    this.conf = conf;
    this.expo = expo;
    this.price = price;
  }

  /**
   * Get price as number. Warning: this conversion might result in an inaccurate number.
   * We store price and confidence values in our Oracle at 64-bit precision, but the JavaScript
   * number type can only represent numbers with 52-bit precision. So if a price or confidence
   * is larger than 52-bits, the conversion will lose the most insignificant bits.
   *
   * @returns a floating point number representing the price
   */
  getPriceAsNumberUnchecked(): number {
    return Number(this.price) * 10 ** this.expo;
  }

  /**
   * Get price as number. Warning: this conversion might result in an inaccurate number.
   * Explanation is the same as `priceAsNumberUnchecked()` documentation.
   *
   * @returns a floating point number representing the price
   */
  getConfAsNumberUnchecked(): number {
    return Number(this.conf) * 10 ** this.expo;
  }
}

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
 * Metadata about the price
 *
 * Represents metadata of a price feed.
 */
export class PriceFeedMetadata {
  /**
   * Attestation time of the price
   */
  attestation_time: number;
  /**
   * Chain of the emitter
   */
  emitter_chain: number;
  /**
   * Sequence number of the price
   */
  sequence_number: number;

  constructor(metadata: {
    attestation_time: number;
    emitter_chain: number;
    sequence_number: number;
  }) {
    this.attestation_time = metadata.attestation_time;
    this.emitter_chain = metadata.emitter_chain;
    this.sequence_number = metadata.sequence_number;
  }
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
   * Metadata about the price
   */
  metadata?: PriceFeedMetadata;
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

  constructor(rawValues: {
    conf: string;
    emaConf: string;
    emaPrice: string;
    expo: number;
    id: HexString;
    maxNumPublishers: number;
    metadata?: PriceFeedMetadata;
    numPublishers: number;
    prevConf: string;
    prevPrice: string;
    prevPublishTime: UnixTimestamp;
    price: string;
    productId: HexString;
    publishTime: UnixTimestamp;
    status: PriceStatus;
  }) {
    this.conf = rawValues.conf;
    this.emaConf = rawValues.emaConf;
    this.emaPrice = rawValues.emaPrice;
    this.expo = rawValues.expo;
    this.id = rawValues.id;
    this.maxNumPublishers = rawValues.maxNumPublishers;
    this.metadata = rawValues.metadata;
    this.numPublishers = rawValues.numPublishers;
    this.prevConf = rawValues.prevConf;
    this.prevPrice = rawValues.prevPrice;
    this.prevPublishTime = rawValues.prevPublishTime;
    this.price = rawValues.price;
    this.productId = rawValues.productId;
    this.publishTime = rawValues.publishTime;
    this.status = rawValues.status;
  }

  static fromJson(json: any): PriceFeed {
    const jsonFeed: JsonPriceFeed = Convert.toPriceFeed(json);
    return new PriceFeed({
      conf: jsonFeed.conf,
      emaConf: jsonFeed.ema_conf,
      emaPrice: jsonFeed.ema_price,
      expo: jsonFeed.expo,
      id: jsonFeed.id,
      maxNumPublishers: jsonFeed.max_num_publishers,
      metadata: jsonFeed.metadata,
      numPublishers: jsonFeed.num_publishers,
      prevConf: jsonFeed.prev_conf,
      prevPrice: jsonFeed.prev_price,
      prevPublishTime: jsonFeed.prev_publish_time,
      price: jsonFeed.price,
      productId: jsonFeed.product_id,
      publishTime: jsonFeed.publish_time,
      status: jsonFeed.status,
    });
  }

  toJson(): any {
    const jsonFeed: JsonPriceFeed = {
      conf: this.conf,
      ema_conf: this.emaConf,
      ema_price: this.emaPrice,
      expo: this.expo,
      id: this.id,
      max_num_publishers: this.maxNumPublishers,
      metadata: this.metadata,
      num_publishers: this.numPublishers,
      prev_conf: this.prevConf,
      prev_price: this.prevPrice,
      prev_publish_time: this.prevPublishTime,
      price: this.price,
      product_id: this.productId,
      publish_time: this.publishTime,
      status: this.status,
    };
    // this is done to avoid sending undefined values to the server
    return Convert.priceFeedToJson(jsonFeed);
  }

  /**
   * Get the current price and confidence interval as fixed-point numbers of the form a * 10^e.
   * This function returns the current best estimate of the price at the time that this `PriceFeed` was
   * published (`publish_time`). This function returns `undefined` if the oracle was unable to determine
   * the price at that time; this condition can happen for various reasons, such as certain markets only
   * trading during certain times.
   *
   * @returns a struct containing the price and confidence interval as of `publish_time`, along with
   * the exponent for both numbers. Returns `undefined` if price information is currently unavailable
   * for any reason.
   */
  getCurrentPrice(): Price | undefined {
    if (this.status !== PriceStatus.Trading) {
      return undefined;
    }

    return new Price(this.conf, this.expo, this.price);
  }

  /**
   * Get the exponentially-weighted moving average price (ema_price) and a confidence interval on the result.
   *
   * @returns a struct containing the ema price, confidence interval, and the exponent for
   * both numbers. Returns `undefined` if price information is currently unavailable for any reason.
   *
   * At the moment, the confidence interval returned by this method is computed in
   * a somewhat questionable way, so we do not recommend using it for high-value applications.
   */
  getEmaPrice(): Price | undefined {
    return new Price(this.emaConf, this.expo, this.emaPrice);
  }

  /**
   * Get the latest available price, along with the timestamp when it was generated.
   * This function returns the same price as `getCurrentPrice` in the case where a price was available
   * at the time this `PriceFeed` was published (`publish_time`). However, if a price was not available
   * at that time, this function returns the price from the latest time at which the price was available.
   * The returned price can be from arbitrarily far in the past; this function makes no guarantees that
   * the returned price is recent or useful for any particular application.
   *
   * Users of this function should check the returned timestamp to ensure that the returned price is
   * sufficiently recent for their application. If you are considering using this function, it may be
   * safer / easier to use either `getCurrentPrice` or `getLatestAvailablePriceWithinDuration`.
   *
   * @returns a struct containing the latest available price, confidence interval, and the exponent for
   * both numbers along with the timestamp when that price was generated.
   */
  getLatestAvailablePriceUnchecked(): [Price, UnixTimestamp] {
    // If the price status is Trading then it's the latest price
    // with the Trading status.
    if (this.status === PriceStatus.Trading) {
      return [new Price(this.conf, this.expo, this.price), this.publishTime];
    }

    return [
      new Price(this.prevConf, this.expo, this.prevPrice),
      this.prevPublishTime,
    ];
  }

  /**
   * Get the latest price as long as it was updated within `duration` seconds of the current time.
   * This function is a sanity-checked version of `getLatestAvailablePriceUnchecked` which is useful in
   * applications that require a sufficiently-recent price. Returns `undefined` if the price wasn't
   * updated sufficiently recently.
   *
   * @param duration return a price as long as it has been updated within this number of seconds
   * @returns a struct containing the latest available price, confidence interval and the exponent for
   * both numbers, or `undefined` if no price update occurred within `duration` seconds of the current time.
   */
  getLatestAvailablePriceWithinDuration(
    duration: DurationInSeconds
  ): Price | undefined {
    const [price, timestamp] = this.getLatestAvailablePriceUnchecked();

    const currentTime: UnixTimestamp = Math.floor(Date.now() / 1000);

    // This checks the absolute difference as a sanity check
    // for the cases that the system time is behind or price
    // feed timestamp happen to be in the future (a bug).
    if (Math.abs(currentTime - timestamp) > duration) {
      return undefined;
    }

    return price;
  }

  /**
   * Get the price feed metadata.
   *
   * @returns a struct containing the attestation time, emitter chain, and the sequence number. 
   * Returns `undefined` if metadata is currently unavailable.
   */
  getMetadata(): PriceFeedMetadata | undefined {
    if (this.metadata === undefined) {
      return undefined;
    }
    return new PriceFeedMetadata(this.metadata);
  }
}
