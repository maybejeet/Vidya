import mongoose from "mongoose";

type ConnectionObject = {
    isConnected?: number
}

const connection : ConnectionObject = {}

export async function isDbConnected(): Promise<boolean> {
    // 1 = connected, 2 = connecting
    const ready = mongoose.connection.readyState;
    return ready === 1 || ready === 2 || !!connection.isConnected;
}

async function dbConnect() : Promise<void>{
    if(connection.isConnected){
        console.log("Alrady connected to db");
        return;
    }
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || '', {})
        // console.log("Logging DB>>>>",db);
        
        connection.isConnected = db.connections[0].readyState
        console.log("Db conncted successfully");
        
    } catch (error) {
        console.error("Error connecting to db", error)        
        process.exit(1);
    }
}

export default dbConnect;