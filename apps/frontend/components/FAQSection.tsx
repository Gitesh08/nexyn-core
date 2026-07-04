"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "What exactly is Project Nexyn?",
    answer: "Project Nexyn is a biomimetic cognitive wrapper. It sits on top of standard graph-vector databases to add automated evaluation, mathematical decay, and instinctual consolidation—preventing context amnesia."
  },
  {
    question: "Doesn't Cognee already manage AI memory?",
    answer: "Cognee is a highly powerful engine for building and querying knowledge graphs. However, naive usage leads to infinite data hoarding. We use Cognee as our core infrastructure, but Nexyn adds the \"Sleep Cycle\" (pruning and memifying) so the Cognee graph remains perfectly sparse and optimized over time."
  },
  {
    question: "How difficult is the integration?",
    answer: "It is a drop-in replacement. Simply route your raw data through `Nexyn.evaluate()` before calling your standard `cognee.add()` and `cognee.cognify()` functions. The background pruning cycle handles the rest."
  },
  {
    question: "Does the Buddhi evaluation layer add high latency?",
    answer: "No. The evaluation layer runs on localized Small Language Models (SLMs) returning strict Pydantic schemas. It is designed to be sub-second, ensuring ingestion remains incredibly fast."
  },
  {
    question: "Is this open source?",
    answer: "Yes. Project Nexyn is fully open-source and designed to be run locally alongside your existing LLM architecture."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto pt-24 pb-12 px-6 font-sans relative z-10">
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
