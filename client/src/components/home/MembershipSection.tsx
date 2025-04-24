import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function MembershipSection() {
  const { user, isAuthenticated, upgradeToPremium } = useAuth();
  
  const handleUpgrade = async () => {
    await upgradeToPremium();
  };
  
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-brown-dark to-midnight-blue text-amber-50">
      <div className="container mx-auto max-w-6xl">
        <h2 className="font-cinzel text-2xl md:text-3xl font-bold mb-3 text-center">Unlock Your Creative Potential</h2>
        <p className="text-center mb-10 max-w-3xl mx-auto font-cormorant text-xl italic">Choose the membership that fits your storytelling journey.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-amber-50 bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-lg p-6 border border-amber-500">
            <div className="text-center mb-6">
              <h3 className="font-cinzel text-2xl font-bold mb-2">Free Tier</h3>
              <p className="text-lg font-cormorant">Begin your storytelling journey</p>
              <p className="text-3xl font-bold mt-4">$0</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Publish 1 full-length novel</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Publish 1 short story</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Basic reader analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Community forum access</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Reader comments & feedback</span>
              </li>
            </ul>
            
            {isAuthenticated ? (
              user?.isPremium ? (
                <Button disabled className="w-full bg-amber-500 text-amber-50 font-cinzel py-3 rounded-md">
                  Current Plan
                </Button>
              ) : (
                <Button disabled className="w-full bg-amber-500 hover:bg-amber-800 text-amber-50 font-cinzel py-3 rounded-md transition-colors">
                  Current Plan
                </Button>
              )
            ) : (
              <Button asChild className="w-full bg-amber-500 hover:bg-amber-800 text-amber-50 font-cinzel py-3 rounded-md transition-colors">
                <Link href="/register">
                  <a>Get Started</a>
                </Link>
              </Button>
            )}
          </div>
          
          {/* Premium Tier */}
          <div className="bg-amber-500 bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-lg p-6 border-2 border-amber-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-800 text-amber-50 px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            
            <div className="text-center mb-6">
              <h3 className="font-cinzel text-2xl font-bold mb-2">Premium Tier</h3>
              <p className="text-lg font-cormorant">Unleash your full potential</p>
              <p className="text-3xl font-bold mt-4">$9.99<span className="text-sm font-normal">/month</span></p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span><strong>Unlimited</strong> novels & stories</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Advanced reader analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Priority story featuring</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Early access to new features</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Author marketing tools</span>
              </li>
              <li className="flex items-start">
                <Check className="text-amber-500 mt-1 mr-2 h-4 w-4" />
                <span>Ad-free reading experience</span>
              </li>
            </ul>
            
            {isAuthenticated ? (
              user?.isPremium ? (
                <Button disabled className="w-full bg-amber-200 text-brown-dark font-cinzel py-3 rounded-md transition-colors font-bold">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-amber-200 hover:bg-amber-500 text-brown-dark font-cinzel py-3 rounded-md transition-colors font-bold"
                >
                  Upgrade Now
                </Button>
              )
            ) : (
              <Button asChild className="w-full bg-amber-200 hover:bg-amber-500 text-brown-dark font-cinzel py-3 rounded-md transition-colors font-bold">
                <Link href="/register?premium=true">
                  <a>Upgrade Now</a>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
