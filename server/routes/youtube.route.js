import youtubesearchapi from "youtube-search-api";

export const searchSongs = async (req, res) => {
  const { search } = req.query;
  const data = await youtubesearchapi.GetListByKeyword(search, false, 10);

  return res.status(500).json(data);
};
