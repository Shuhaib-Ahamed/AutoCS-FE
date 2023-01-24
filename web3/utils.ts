import axios from "axios";

export const getAssetKeyPair = async () => {
  const { data } = await axios.get(
    "http://localhost:9000/api/v1/chain/getAssetKeyPair"
  );
  return data;
};

export const createAsset = async (data: any) => {
  try {
    const result = await axios.post(
      "http://localhost:9000/api/v1/chain/createAsset",
      data,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
