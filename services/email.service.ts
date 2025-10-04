interface EmailServiceParams {
  contactPerson: string;
  person: string;
  receiverEmail: string;
  dashboardUrl: string;
  sharingPolicy: string;
}

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
