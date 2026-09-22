import { Country, State, City } from "country-state-city";

// 1. All Countries (250 Countries)
export const ALL_COUNTRIES = Country.getAllCountries();

export const ALL_COUNTRY_NAMES = ALL_COUNTRIES.map((c) => c.name);

// 2. Dynamic Country Codes & Names for Phone dropdowns
export const COUNTRY_CODES = ALL_COUNTRIES.map(
  (c) => `${c.phonecode.replace("+", "")}-${c.isoCode}`
);

export const COUNTRY_NAMES = Object.fromEntries(
  ALL_COUNTRIES.map((c) => [
    `${c.phonecode.replace("+", "")}-${c.isoCode}`,
    `+${c.phonecode.replace("+", "")} - ${c.name}`,
  ])
);

// Helper to get Country ISO code from Name
export const getCountryIsoCode = (countryName) => {
  if (!countryName) return "IN";
  const match = ALL_COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryName.trim().toLowerCase()
  );
  return match ? match.isoCode : "IN";
};

// Helper to get States of a Country by Country Name or ISO
export const getStatesForCountry = (countryIdentifier = "India") => {
  const iso =
    countryIdentifier && countryIdentifier.length === 2
      ? countryIdentifier.toUpperCase()
      : getCountryIsoCode(countryIdentifier);
  const states = State.getStatesOfCountry(iso);
  if (states && states.length > 0) {
    return states.map((s) => s.name);
  }
  return State.getAllStates().map((s) => s.name);
};

// Helper to get Cities of a Country / State
export const getCitiesForLocation = (
  countryIdentifier = "India",
  stateName = ""
) => {
  const countryIso =
    countryIdentifier && countryIdentifier.length === 2
      ? countryIdentifier.toUpperCase()
      : getCountryIsoCode(countryIdentifier);

  if (stateName) {
    const states = State.getStatesOfCountry(countryIso);
    const matchedState = states.find(
      (s) => s.name.toLowerCase() === stateName.trim().toLowerCase()
    );
    if (matchedState) {
      const citiesOfState = City.getCitiesOfState(
        countryIso,
        matchedState.isoCode
      );
      if (citiesOfState && citiesOfState.length > 0) {
        return citiesOfState.map((c) => c.name);
      }
    }
  }

  const citiesOfCountry = City.getCitiesOfCountry(countryIso);
  if (citiesOfCountry && citiesOfCountry.length > 0) {
    return citiesOfCountry.map((c) => c.name);
  }

  return City.getAllCities()
    .slice(0, 500)
    .map((c) => c.name);
};

// Helper for Origin Cities (Popular + major cities with country tag)
export const getPopularOriginCities = () => {
  const inCities = City.getCitiesOfCountry("IN");
  const popularNames = [
    "New Delhi",
    "Mumbai",
    "Bengaluru",
    "Kolkata",
    "Chennai",
    "Hyderabad",
    "Jaipur",
    "Ahmedabad",
    "Pune",
    "Chandigarh",
    "Goa",
    "Kochi",
    "Shimla",
    "Manali",
    "Srinagar",
    "Varanasi",
    "Agra",
    "Surat",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane",
    "Bhopal",
    "Visakhapatnam",
    "Patna",
    "Vadodara",
    "Ghaziabad",
    "Ludhiana",
    "Nashik",
    "Faridabad",
    "Meerut",
    "Rajkot",
    "Aurangabad",
    "Dhanbad",
    "Amritsar",
    "Navi Mumbai",
    "Allahabad",
    "Ranchi",
    "Howrah",
    "Coimbatore",
    "Jabalpur",
    "Gwalior",
    "Vijayawada",
    "Jodhpur",
    "Madurai",
    "Raipur",
    "Kota",
    "Guwahati",
    "Solapur",
    "Hubballi",
  ];

  const popularSet = new Set(popularNames.map((n) => n.toLowerCase()));
  const list = [];

  popularNames.forEach((name) => {
    list.push(`${name}, India`);
  });

  if (inCities) {
    inCities.forEach((c) => {
      if (!popularSet.has(c.name.toLowerCase())) {
        list.push(`${c.name}, India`);
      }
    });
  }

  return list;
};

// Helper for Destinations (Top holiday destinations + Indian states/cities + international countries)
export const getPopularDestinations = () => {
  const popular = [
    "Goa, India",
    "Kashmir, India",
    "Himachal Pradesh, India",
    "Manali, Himachal Pradesh, India",
    "Shimla, Himachal Pradesh, India",
    "Kerala, India",
    "Munnar, Kerala, India",
    "Jaipur, Rajasthan, India",
    "Udaipur, Rajasthan, India",
    "Andaman and Nicobar Islands, India",
    "Ladakh, India",
    "Uttarakhand, India",
    "Rishikesh, Uttarakhand, India",
    "Dubai, United Arab Emirates",
    "Bangkok, Thailand",
    "Phuket, Thailand",
    "Pattaya, Thailand",
    "Singapore",
    "Bali, Indonesia",
    "Maldives",
    "Kuala Lumpur, Malaysia",
    "Langkawi, Malaysia",
    "Vietnam",
    "Hanoi, Vietnam",
    "Da Nang, Vietnam",
    "Nepal",
    "Kathmandu, Nepal",
    "Bhutan",
    "Sri Lanka",
    "Colombo, Sri Lanka",
    "Paris, France",
    "Switzerland",
    "Zurich, Switzerland",
    "London, United Kingdom",
    "Rome, Italy",
    "Barcelona, Spain",
    "New York, United States",
    "Tokyo, Japan",
    "Sydney, Australia",
    "Mauritius",
    "Egypt",
    "Cairo, Egypt",
  ];

  const popularSet = new Set(popular.map((p) => p.toLowerCase()));
  const list = [...popular];

  // Also include all country names
  ALL_COUNTRIES.forEach((c) => {
    if (!popularSet.has(c.name.toLowerCase())) {
      list.push(c.name);
    }
  });

  return list;
};

