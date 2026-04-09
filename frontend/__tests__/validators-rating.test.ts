import { ratingSchema } from "@/lib/validators/rating";

describe("ratingSchema", () => {
  it("accepts 3 stars with comment", () => {
    expect(() =>
      ratingSchema.parse({ stars: 3, comment: "ok", listingId: 1 })
    ).not.toThrow();
  });

  it("rejects 6 stars", () => {
    expect(() =>
      ratingSchema.parse({ stars: 6, listingId: 1 })
    ).toThrow();
  });

  it("rejects 0 stars", () => {
    expect(() =>
      ratingSchema.parse({ stars: 0, listingId: 1 })
    ).toThrow();
  });

  it("rejects comment > 500 chars", () => {
    expect(() =>
      ratingSchema.parse({
        stars: 4,
        comment: "a".repeat(501),
        listingId: 1,
      })
    ).toThrow();
  });
});
