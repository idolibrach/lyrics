import { getUser } from "@/appwrite";
import Navbar from "./components/Navbar";
import { SearchSong } from "./Search";
import BlurAlbumBackground from "./components/BlurAlbumBackground";

export default async function Home() {
  return (
    <main className="w-full h-full flex justify-center pt-4 relative">
      <SearchSong />
    </main>
  );
}
