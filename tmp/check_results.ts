import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentCoreReading() {
  const { data, error } = await supabase
    .from("reading_results")
    .select("*")
    .ilike("spread_hash", "%_core_%")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching core reading:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No core readings found.");
    return;
  }

  console.log("Latest Core Reading Result:");
  console.log(JSON.stringify(data[0], null, 2));
}

checkRecentCoreReading();
