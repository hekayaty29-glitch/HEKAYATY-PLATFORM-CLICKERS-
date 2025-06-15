import HekayatyOriginals from "@/components/home/HekayatyOriginals";
import { Helmet } from "react-helmet";

export default function HekayatyOriginalStoriesPage() {
  return (
    <>
      <Helmet>
        <title>Hekayaty Original Stories</title>
        <meta
          name="description"
          content="Explore exclusive Hekayaty Original stories crafted by our community's finest authors."
        />
      </Helmet>

      <HekayatyOriginals showSearch />
    </>
  );
}
