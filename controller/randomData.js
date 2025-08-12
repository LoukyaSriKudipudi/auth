exports.getData = async (req, res) => {
  const response = await fetch(
    "https://api.dictionaryapi.dev/api/v2/entries/en/hello"
  );
  console.log(req.user);
  const data = await response.json();
  const word = data[0].word;
  const meaning = data[0].meanings;

  res.status(200).json({
    status: "success",
    data: {
      word,
      meaning,
    },
  });
};
