import { Link } from "wouter";
import { Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-midnight-blue text-amber-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="font-cinzel text-xl font-bold mb-4">TaleKeeper</h3>
            <p className="text-sm mb-4 text-gray-300">A magical platform for readers and writers to connect, create, and explore endless worlds of imagination.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-amber-50 hover:text-amber-500 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-amber-50 hover:text-amber-500 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-amber-50 hover:text-amber-500 transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-amber-50 hover:text-amber-500 transition-colors">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
          
          {/* Column 2: Explore */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/stories">
                  <a className="hover:text-amber-500 transition-colors">Browse Stories</a>
                </Link>
              </li>
              <li>
                <Link href="/top-rated">
                  <a className="hover:text-amber-500 transition-colors">Top Rated</a>
                </Link>
              </li>
              <li>
                <Link href="/stories?sort=new">
                  <a className="hover:text-amber-500 transition-colors">New Releases</a>
                </Link>
              </li>
              <li>
                <Link href="/authors">
                  <a className="hover:text-amber-500 transition-colors">Featured Authors</a>
                </Link>
              </li>
              <li>
                <Link href="/reading-lists">
                  <a className="hover:text-amber-500 transition-colors">Reading Lists</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Authors */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-4">For Authors</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/publish">
                  <a className="hover:text-amber-500 transition-colors">Start Writing</a>
                </Link>
              </li>
              <li>
                <Link href="/guidelines">
                  <a className="hover:text-amber-500 transition-colors">Author Guidelines</a>
                </Link>
              </li>
              <li>
                <Link href="/resources">
                  <a className="hover:text-amber-500 transition-colors">Writer Resources</a>
                </Link>
              </li>
              <li>
                <Link href="/contests">
                  <a className="hover:text-amber-500 transition-colors">Writing Contests</a>
                </Link>
              </li>
              <li>
                <Link href="/success-stories">
                  <a className="hover:text-amber-500 transition-colors">Success Stories</a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Support */}
          <div>
            <h3 className="font-cinzel text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/help">
                  <a className="hover:text-amber-500 transition-colors">Help Center</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-amber-500 transition-colors">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:text-amber-500 transition-colors">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:text-amber-500 transition-colors">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines">
                  <a className="hover:text-amber-500 transition-colors">Community Guidelines</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} TaleKeeper. All rights reserved. A magical realm for storytellers and dreamers.</p>
        </div>
      </div>
    </footer>
  );
}
