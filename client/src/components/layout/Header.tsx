import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFlag } from "@/lib/flags";
import { Menu, BookOpen, PenSquare, Award, Users, ChevronDown, ShoppingBag, Megaphone, Shield } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const showRecs = useFlag("recommendations");

  return (
    <header className="bg-gradient-to-r from-brown-dark to-midnight-blue text-amber-50 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-2xl md:text-3xl font-cinzel font-bold">
            <span className="text-amber-500">Heka</span>yaty
          </Link>
        </div>
        
        {/* Navigation for desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/stories" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>Discover</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link" className="font-cinzel text-sm text-amber-50 hover:text-amber-500 p-0 flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Genres</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-midnight-blue border-amber-500">
              <DropdownMenuItem asChild>
                <Link href="/genres/1" className="cursor-pointer hover:bg-amber-900">Fantasy</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/2" className="cursor-pointer hover:bg-amber-900">Romance</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/3" className="cursor-pointer hover:bg-amber-900">Mystery</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/4" className="cursor-pointer hover:bg-amber-900">Science Fiction</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/5" className="cursor-pointer hover:bg-amber-900">Horror</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/genres/6" className="cursor-pointer hover:bg-amber-900">Adventure</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/genres" className="cursor-pointer hover:bg-amber-900">All Genres</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Link href="/top-rated" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span>Rankings</span>
          </Link>
          
          <Link href="/bazaar" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <ShoppingBag className="h-4 w-4" />
            <span>Bazaar</span>
          </Link>
          
          <Link href="/news" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <Megaphone className="h-4 w-4" />
            <span>Hekayaty</span>
          </Link>
          
          {showRecs && (
             <Link href="/recommendations" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
               <Award className="h-4 w-4" />
               <span>For You</span>
             </Link>
           )}
           {isAuthenticated && (
             <Link href="/publish" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
              <PenSquare className="h-4 w-4" />
              <span>Write</span>
            </Link>
          )}
          
          {isAuthenticated && user?.isAdmin && (
            <Link href="/admin" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
          
          <Link href="/community" className="font-cinzel text-sm hover:text-amber-500 transition-colors flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Community</span>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-amber-500 text-brown-dark">
                      {user?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-midnight-blue border-amber-500" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-amber-50">{user?.fullName}</p>
                    <p className="text-xs leading-none text-amber-200">@{user?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user?.id}`} className="cursor-pointer hover:bg-amber-900">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/workspace" className="cursor-pointer hover:bg-amber-900">Workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer hover:bg-amber-900">Settings</Link>
                </DropdownMenuItem>
                {!user?.isPremium && (
                  <DropdownMenuItem asChild>
                    <Link href="/upgrade" className="cursor-pointer text-amber-500 font-semibold hover:bg-amber-900">Upgrade to Premium</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="cursor-pointer hover:bg-amber-900"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden md:inline-flex text-amber-50 hover:text-amber-500 hover:bg-transparent border border-amber-500">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex bg-amber-500 hover:bg-amber-600 text-brown-dark border-none">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
          
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-0 h-9 w-9 rounded-full">
                <Menu className="h-5 w-5 text-amber-50" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-midnight-blue text-amber-50 border-amber-500">
              <SheetHeader>
                <SheetTitle className="text-amber-50">
                  <Link href="/" onClick={closeMobileMenu} className="inline-flex items-center text-2xl font-cinzel font-bold mb-6">
                    <span className="text-amber-500">Heka</span>yaty
                  </Link>
                </SheetTitle>
                <SheetDescription className="text-amber-200">
                  Explore magical worlds of stories
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                {isAuthenticated && user && (
                  <div className="flex items-center space-x-3 mb-6">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback className="bg-amber-500 text-brown-dark">
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-amber-300">@{user.username}</p>
                    </div>
                  </div>
                )}
                
                <Link href="/stories" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                  <BookOpen className="mr-2 h-5 w-5" />
                  <span>Discover</span>
                </Link>
                
                <Link href="/genres" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                  <Award className="mr-2 h-5 w-5" />
                  <span>Genres</span>
                </Link>
                
                <Link href="/top-rated" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                  <Award className="mr-2 h-5 w-5" />
                  <span>Rankings</span>
                </Link>
                
                <Link href="/bazaar" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  <span>Bazaar</span>
                </Link>
                
                <Link href="/news" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                  <Megaphone className="mr-2 h-5 w-5" />
                  <span>Hekayaty</span>
                </Link>
                
                {isAuthenticated && (
                  <Link href="/publish" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                    <PenSquare className="mr-2 h-5 w-5" />
                    <span>Write</span>
                  </Link>
                )}
                
                {isAuthenticated && user?.isAdmin && (
                  <Link href="/admin" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                    <Shield className="mr-2 h-5 w-5" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <Link href="/community" onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">
                  <Users className="mr-2 h-5 w-5" />
                  <span>Community</span>
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <Link href={`/profile/${user?.id}`} onClick={closeMobileMenu} className="flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors">Profile</Link>
                    <button 
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      className="w-full text-left flex items-center py-2 px-1 rounded-md hover:bg-amber-900 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="pt-4 flex flex-col space-y-2">
                    <Button asChild variant="outline" className="border-amber-500 text-amber-50 hover:bg-amber-900 hover:text-amber-50">
                      <Link href="/login" onClick={closeMobileMenu}>Sign In</Link>
                    </Button>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-brown-dark">
                      <Link href="/register" onClick={closeMobileMenu}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
