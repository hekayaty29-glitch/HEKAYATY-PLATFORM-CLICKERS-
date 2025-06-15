import WritersGemsSection from "@/components/home/WritersGemsSection";
import { Helmet } from "react-helmet";

export default function WritersGemsPage() {
  return (
    <>
      <Helmet>
        <title>Writer's Gems</title>
        <meta
          name="description"
          content="Prize-winning stories from our community competitions."
        />
      </Helmet>
      <WritersGemsSection />
    </>
  );
}
