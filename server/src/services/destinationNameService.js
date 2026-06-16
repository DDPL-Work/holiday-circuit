import DestinationName from "../models/destinationName.model.js";

export const normalizeDestinationLabel = (value = "") =>
  String(value || "").replace(/\s+/g, " ").trim();

export const getDestinationKey = (value = "") =>
  normalizeDestinationLabel(value).toLowerCase();

export const ensureDestinationName = async ({
  label,
  city = "",
  country = "",
  source = "manual",
  createdBy = null,
} = {}) => {
  const normalizedLabel = normalizeDestinationLabel(label);
  const normalizedKey = getDestinationKey(normalizedLabel);

  if (!normalizedLabel || !normalizedKey) return null;

  const normalizedCity = normalizeDestinationLabel(city);
  const normalizedCountry = normalizeDestinationLabel(country);
  const update = {
    $setOnInsert: {
      normalizedKey,
      createdBy,
    },
    $set: {
      label: normalizedLabel,
      source,
      lastUsedAt: new Date(),
    },
  };

  if (normalizedCity) update.$set.city = normalizedCity;
  if (normalizedCountry) update.$set.country = normalizedCountry;

  try {
    return await DestinationName.findOneAndUpdate(
      { normalizedKey },
      update,
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return DestinationName.findOne({ normalizedKey });
    }

    throw error;
  }
};

export const ensureDestinationNames = async (destinations = []) => {
  const seenKeys = new Set();
  const normalizedDestinations = destinations
    .map((destination) => {
      const label = normalizeDestinationLabel(
        destination?.label ||
          [destination?.city, destination?.country].filter(Boolean).join(", "),
      );
      const normalizedKey = getDestinationKey(label);

      if (!label || !normalizedKey || seenKeys.has(normalizedKey)) return null;
      seenKeys.add(normalizedKey);

      return {
        ...destination,
        label,
      };
    })
    .filter(Boolean);

  if (!normalizedDestinations.length) return [];

  return Promise.all(
    normalizedDestinations.map((destination) => ensureDestinationName(destination)),
  );
};
