import { Link } from "wouter";
import { Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-midnight-blue text-amber-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="font-cinzel text-xl font-bold mb-4">HEKAYATY</h3>
            <p className="text-sm mb-4 text-gray-300">A magical platform for readers and writers to connect, create, and explore endless worlds of imagination.</p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61577990000626" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-50 hover:text-amber-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://www.youtube.com/@Hekayaty-q2i" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#FF0000] hover:opacity-80 transition-opacity"
                aria-label="YouTube"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Column 2: Explore */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/originals" className="hover:text-amber-500 transition-colors">Hekayaty World</Link>
              </li>
              <li>
                <Link href="/top-rated" className="hover:text-amber-500 transition-colors">Top Rated</Link>
              </li>
              <li>
                <Link href="/originals" className="hover:text-amber-500 transition-colors">Hekayaty Originals</Link>
              </li>
              <li>
                <Link href="/characters" className="hover:text-amber-500 transition-colors">Hekayaty Characters</Link>
              </li>
              <li>
                <Link href="/talecraft" className="hover:text-amber-500 transition-colors">TaleCraft</Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-amber-500 transition-colors">Community</Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Support */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/contact" className="hover:text-amber-500 transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-amber-500 transition-colors">Community Guidelines</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} HEKAYATY. All rights reserved. A magical realm for storytellers and dreamers.</p>
        </div>
      </div>
    </footer>
  );
}
