export async function sendPushNotification({
  token,
  title,
  body,
  rawData,
}: {
  token: string;
  title: string;
  body: string;
  rawData?: Record<string, string>;
}): Promise<void> {
  try {
    console.log("Sending push notification to:", token);
    const response = await fetch(
      "https://zajzaxnkswpsdwuxpdin.supabase.co/functions/v1/smooth-action",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          token,
          title,
          body,
          rawData: rawData || {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send push notification");
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}
