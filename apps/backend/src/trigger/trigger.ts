import mongoose from "mongoose";

async function triggerDemo(): Promise<void> {
  const nameCollection = "contributors";
  const db = mongoose.connection.collection(nameCollection);

  const changeStream = db.watch([{ $match: { operationType: "insert" } }]);

  changeStream.on("change", async (change: any) => {
    const type = change.fullDocument.type;
    const nums = await db.countDocuments({ type: type });
    console.log(`there are ${nums} contributor has type ${type}`);
  });
  changeStream.on("error", (error) => {
    console.log(error);
  });
}
export { triggerDemo };
