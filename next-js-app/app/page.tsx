import Link from "next/link";
import MainHeading from "@/components/common/mainHeading";
import OptBtn from "@/components/common/optBtn";

export default function Home() {
  const gameTypes = [
    {
      title: "Local Game",
      url: "/local-game",
    },
    {
      title: "Multiplayer Game",
      url: "/multiplayer",
    },
  ];
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <MainHeading text="Select Game Type" />
        {gameTypes.map((val, index) => (
          <Link key={index} href={val.url}>
            <OptBtn text={val.title} />
          </Link>
        ))}
      </div>
    </main>
  );
}
