import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function run() {
  try {
    initializeApp();
    const db = getFirestore();
    const leadsRef = db.collection("leads");
    const snapshot = await leadsRef.limit(100).get();
    
    let withUserId = 0;
    let withSellerId = 0;
    let both = 0;
    let neither = 0;
    let sample = null;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const hasUserId = !!data.userId;
      const hasSellerId = !!data.sellerId;
      
      if (hasUserId && hasSellerId) both++;
      else if (hasUserId) withUserId++;
      else if (hasSellerId) withSellerId++;
      else neither++;
      
      if (!sample) {
        sample = { ...data };
        if (sample.email) sample.email = "anonymized@example.com";
        if (sample.phone) sample.phone = "555-0000";
        if (sample.fullName) sample.fullName = "John Doe";
      }
    });
    
    console.log("LEADS COLLECTION STATS:");
    console.log("Total docs fetched (limit 100):", snapshot.size);
    console.log("- with userId:", withUserId);
    console.log("- with sellerId:", withSellerId);
    console.log("- with both:", both);
    console.log("- with neither:", neither);
    console.log("Sample lead:", JSON.stringify(sample, null, 2));

    const usersRef = db.collection("users");
    const usersSnap = await usersRef.limit(1).get();
    if (!usersSnap.empty) {
      const uDoc = usersSnap.docs[0];
      console.log("Found user profile at users/" + uDoc.id);
      const profileSnap = await uDoc.ref.collection("profile").doc("main").get();
      if (profileSnap.exists) {
        console.log("Profile data:", JSON.stringify(profileSnap.data(), null, 2));
      } else {
        console.log("No profile/main found for user.");
      }
    } else {
      console.log("No users found.");
    }
    
    const sellersRef = db.collection("seller_profiles");
    const sellersSnap = await sellersRef.limit(1).get();
    console.log("Does seller_profiles collection exist?", !sellersSnap.empty);
    
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
