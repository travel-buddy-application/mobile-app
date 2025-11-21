import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const uploadProfileImage = async (
  imageUri: string,
  userId: string
): Promise<ImageUploadResult> => {
  try {
    // Create a unique filename
    const fileExt = imageUri.split(".").pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    console.log("📤 Uploading profile image:", fileName);

    // Read the file as base64 for React Native
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from("profile-images")
      .upload(`avatars/${fileName}`, uint8Array, {
        contentType: `image/${fileExt}`,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("profile-images")
      .getPublicUrl(`avatars/${fileName}`);

    console.log("✅ Image uploaded successfully:", urlData.publicUrl);

    return {
      success: true,
      imageUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error("❌ Profile image upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};

export const deleteProfileImage = async (
  imageUrl: string
): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `avatars/${fileName}`;

    const { error } = await supabase.storage
      .from("profile-images")
      .remove([filePath]);

    if (error) {
      console.error("❌ Delete error:", error);
      return false;
    }

    console.log("✅ Profile image deleted successfully");
    return true;
  } catch (error) {
    console.error("❌ Profile image deletion failed:", error);
    return false;
  }
};
