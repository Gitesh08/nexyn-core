"use client";

import { motion } from "framer-motion";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function PenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="2"/>
    </svg>
  );
}

const team = [
  { 
    name: "Vinay Ghate", 
    title: "AI Engineer",
    image: "https://res.cloudinary.com/db7h39kx9/image/upload/v1783236208/vinay_gwvooh.jpg",
    links: { 
      github: "https://github.com/vinay-ghate", 
      linkedin: "https://www.linkedin.com/in/vinay-ghate/",
      website: "https://v1nay.is-a.dev/"
    }
  },
  { 
    name: "Gitesh Mahadik", 
    title: "Full stack AI Engineer",
    image: "https://res.cloudinary.com/db7h39kx9/image/upload/v1783226970/hero-image_xcgdmw.png",
    links: { 
      github: "https://github.com/Gitesh08", 
      linkedin: "https://www.linkedin.com/in/gitesh-mahadik-7487961a0/",
      website: "https://gitesh.is-a.dev",
      medium: "https://medium.com/@gitesh08"
    }
  },
  { 
    name: "Shruti Birari", 
    title: "Data Modeling",
    image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=400&auto=format&fit=crop",
    links: { github: "#", linkedin: "#" }
  },
];

export function TeamSection() {
  return (
    <div className="w-full max-w-5xl mx-auto pt-24 pb-32 px-6 relative z-10 font-sans">
      <div className="text-center mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tighter mb-3">
          The Architects
        </h2>
        <p className="text-[#888888] font-normal text-sm">
          Constructing the biological memory pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {team.map((member) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="group relative"
          >
            <div className="relative flex flex-col bg-transparent border border-[#333333] rounded-none group-hover:border-white transition-colors duration-300 overflow-hidden h-full">
              
              {/* Image Container */}
              <div className="w-full aspect-square overflow-hidden bg-[#111111] border-b border-[#333333] group-hover:border-white transition-colors duration-300">
                {/* Using standard img to avoid next/image setup overhead, just for rapid prototyping */}
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover grayscale contrast-[1.2] group-hover:grayscale-0 transition-all duration-500"
                />
              </div>

              {/* Typography / Footer */}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {member.name}
                  </h3>
                  <p className="text-[10px] text-[#888888] font-medium mt-1 uppercase tracking-widest">
                    {member.title}
                  </p>
                </div>

                {/* Socials */}
                <div className="flex items-center justify-end gap-3 mt-6">
                  {member.links.website && (
                    <a href={member.links.website} target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-white transition-colors duration-300" title="Website">
                      <GlobeIcon />
                    </a>
                  )}
                  {member.links.medium && (
                    <a href={member.links.medium} target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-white transition-colors duration-300" title="Medium">
                      <PenIcon />
                    </a>
                  )}
                  {member.links.github && (
                    <a href={member.links.github} target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-white transition-colors duration-300" title="GitHub">
                      <GithubIcon />
                    </a>
                  )}
                  {member.links.linkedin && (
                    <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-white transition-colors duration-300" title="LinkedIn">
                      <LinkedinIcon />
                    </a>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
