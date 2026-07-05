"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "What is AI Context Bloat and how does it affect LLMs?",
    answer: "Context bloat happens when an AI remembers every single detail indefinitely. This causes the AI's database to grow massive over time, which dramatically slows down response times, confuses the AI with irrelevant data, and drastically increases your API token costs."
  },
  {
    question: "How does Nexyn Core solve the context bloat problem?",
    answer: "Nexyn gives your AI a 'biological' memory. Instead of storing everything forever, it scores new information for importance. Useful facts are kept alive, while useless noise naturally fades away and deletes itself over time—just like a human brain."
  },
  {
    question: "What is the difference between Nexyn and standard Vector Databases?",
    answer: "Standard vector databases (like Pinecone or Milvus) are simply hard drives for AI—they store whatever you give them forever. Nexyn is a smart filtering layer that sits on top of your database, deciding what is actually worth remembering and what should be forgotten."
  },
  {
    question: "Does Nexyn integrate with Cognee?",
    answer: "Yes! Nexyn is specifically designed as a drop-in upgrade for Cognee. It perfectly wraps around Cognee's graph architecture, ensuring that only high-value, curated information ever enters your Cognee knowledge graph."
  },
  {
    question: "Will adding a memory evaluation layer slow down my AI?",
    answer: "No. The evaluation process runs in milliseconds using blazing-fast NVIDIA NIM infrastructure. Because Nexyn keeps your database incredibly lean and noise-free, your overall AI retrieval and response times will actually become much faster."
  },
  {
    question: "Is Nexyn open source and free to use?",
    answer: "Yes, Nexyn Core is a 100% open-source Python package (MIT License). You can install it via pip and use it completely free for both personal and commercial projects."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="w-full max-w-[800px] mx-auto pt-24 pb-12 px-6 font-sans relative z-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tighter">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="flex flex-col">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={index} className="border-b border-[#333333]">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between py-6 text-left hover:text-[#E5E5E5] transition-colors focus:outline-none"
              >
                <span className="text-white font-medium text-lg tracking-tight">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="text-[#888888] shrink-0 ml-4"
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-[#888888] text-base leading-relaxed pr-8">
                      {/* Handle inline code block styling for the integration question */}
                      {faq.answer.includes("`") ? (
                        faq.answer.split(/(`[^`]+`)/).map((part, i) => 
                          part.startsWith("`") ? (
                            <span key={i} className="font-mono text-white bg-[#111111] px-1.5 py-0.5 rounded text-sm">
                              {part.replace(/`/g, "")}
                            </span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )
                      ) : (
                        faq.answer
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
