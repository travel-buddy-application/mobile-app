interface EmailServiceParams {
  contactPerson: string;
  person: string;
  receiverEmail: string;
  dashboardUrl: string;
  sharingPolicy: string;
}

interface LocationEmailParams {
  contactPerson: string;
  person: string;
  receiverEmail: string;
  tripName: string;
  mapsUrl: string;
  locationMessage: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  isEmergency: boolean;
  emergencyMessage?: string;
  sharingPolicy: string;
}

interface OTPEmailParams {
  receiverEmail: string;
  otpCode: string;
  userName?: string;
}

export const otpEmailService = async ({
  receiverEmail,
  otpCode,
  userName = "User",
}: OTPEmailParams) => {
  try {
    console.log("Sending OTP email to:", receiverEmail);
    const response = await fetch(
      "https://zajzaxnkswpsdwuxpdin.supabase.co/functions/v1/send-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "otp-verification",
          receiverEmail,
          otpCode,
          userName,
        }),
      }
    );

    const data = await response.json();
    console.log("OTP email result:", data);
    return data;
  } catch (err) {
    console.log("OTP email ERROR", err);
    throw err;
  }
};

export const emailService = async ({
  contactPerson,
  person,
  receiverEmail,
  dashboardUrl,
  sharingPolicy,
}: EmailServiceParams) => {
  try {
    console.log("dashboardUrl", dashboardUrl);
    const response = await fetch(
      "https://zajzaxnkswpsdwuxpdin.supabase.co/functions/v1/send-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          contactPerson: contactPerson,
          person: person,
          receiverEmail: receiverEmail,
          dashboardUrl: dashboardUrl,
          sharingPolicy: sharingPolicy,
        }),
      }
    );

    const data = await response.json();
    console.log("Result:", data);
  } catch (err) {
    console.log("ERROR", err);
  }
};

export const locationEmailService = async ({
  contactPerson,
  person,
  receiverEmail,
  tripName,
  mapsUrl,
  locationMessage,
  coordinates,
  isEmergency,
  emergencyMessage,
  sharingPolicy,
}: LocationEmailParams) => {
  try {
    console.log("Sending location email to:", receiverEmail);
    const response = await fetch(
      "https://zajzaxnkswpsdwuxpdin.supabase.co/functions/v1/send-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "location-share", // Indicate this is a location sharing email
          contactPerson,
          person,
          receiverEmail,
          tripName,
          mapsUrl,
          locationMessage,
          coordinates,
          isEmergency,
          emergencyMessage,
          sharingPolicy,
        }),
      }
    );

    const data = await response.json();
    console.log("Location email result:", data);
    return data;
  } catch (err) {
    console.log("Location email ERROR", err);
    throw err;
  }
};
