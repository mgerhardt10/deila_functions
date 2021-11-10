const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

exports.isEmpty = (str) => {
  if (typeof(str) === "string" && str.trim() === "") return true;
  else return false;
};

exports.validateSignupData = (data) => {
  const errors = {};

  if (exports.isEmpty(data.email)) {
    errors.email = "Must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address";
  }

  if (exports.isEmpty(data.password)) errors.password = "Must not be empty";
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }
  if (exports.isEmpty(data.handle)) errors.handle = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  const errors = {};

  if (exports.isEmpty(data.email)) errors.email = "Must not be empty";
  if (exports.isEmpty(data.password)) errors.password = "Must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLocation = (data) => {
  const errors = {};
  const countriesWithRegions = [
    "australia",
    "brazil",
    "canada",
    "china",
    "ethopia",
    "france",
    "germany",
    "india",
    "indonesia",
    "italy",
    "japan",
    "mexico",
    "russia",
    "south africa",
    "spain",
    "uk",
    "u.k.",
    "united kingdom",
    "the united kingdom",
    "us",
    "usa",
    "u.s.a",
    "united states",
    "united states of america",
    "the united states of america",
    "vietnam",
  ];

  if (exports.isEmpty(data.country)) errors.country = "Country cannot be empty";
  if (exports.isEmpty(data.city)) errors.city = "City cannot be empty";

  if (countriesWithRegions.includes(data.state.trim().toLowerCase()) &&
        exports.isEmpty(data.state)) {
    errors.state = "State cannot be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
