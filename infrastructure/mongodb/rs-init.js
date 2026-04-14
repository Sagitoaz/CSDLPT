const members = [
  { _id: 0, host: process.env.MONGO1_HOST || "mongo1:27017" },
  { _id: 1, host: process.env.MONGO2_HOST || "mongo2:27018" },
  { _id: 2, host: process.env.MONGO3_HOST || "mongo3:27019" },
];

rs.initiate({
  _id: "rsCharity",
  members,
});
