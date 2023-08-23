type props = {
  text: string;
};
function heading({ text }: props) {
  return (
    <h1 className="text-3xl font-extrabold text-blue-500 border-b-4 border-blue-500 py-2 mb-5">
      {text}
    </h1>
  );
}

export default heading;
