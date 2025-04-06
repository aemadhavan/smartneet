export const questions = [
    {
      id: 1,
      year: "2023",
      subject: "Biology",
      topic: "Human Physiology",
      difficulty: "Medium",
      question: "Which of the following statements about the human respiratory system is incorrect?",
      options: [
        { id: "A", text: "The partial pressure of O₂ in alveolar air is about 104 mm Hg" },
        { id: "B", text: "The partial pressure of CO₂ in alveolar air is about 40 mm Hg" },
        { id: "C", text: "Oxyhaemoglobin dissociation curve is sigmoid in shape", correct: true },
        { id: "D", text: "The enzyme carbonic anhydrase is present in the plasma of blood" }
      ],
      explanation: "The correct statement is that oxyhaemoglobin dissociation curve is sigmoid in shape. The incorrect statement is option D: The enzyme carbonic anhydrase is present in RBCs, not in the plasma of blood.",
      stats: "75% answered correctly"
    },
    {
      id: 2,
      year: "2022",
      subject: "Biology",
      topic: "Cell Biology",
      difficulty: "Hard",
      question: "Which of the following statements is incorrect regarding mitochondria?",
      options: [
        { id: "A", text: "Inner membrane is convoluted with infoldings" },
        { id: "B", text: "Matrix contains single circular DNA molecule" },
        { id: "C", text: "Outer membrane is porous due to presence of VDAC" },
        { id: "D", text: "Inner membrane is permeable to all kinds of molecules", correct: true }
      ],
      explanation: "The inner mitochondrial membrane is selectively permeable, not permeable to all kinds of molecules. It contains specific transporters for the regulated movement of metabolites.",
      stats: "62% answered correctly"
    },
    {
      id: 3,
      year: "2021",
      subject: "Biology",
      topic: "Genetics",
      difficulty: "Easy",
      question: "Which enzyme is responsible for the conversion of RNA to DNA?",
      options: [
        { id: "A", text: "DNA polymerase" },
        { id: "B", text: "Reverse transcriptase", correct: true },
        { id: "C", text: "RNA polymerase" },
        { id: "D", text: "Primase" }
      ],
      explanation: "Reverse transcriptase is the enzyme that catalyzes the formation of DNA from an RNA template, a process termed as reverse transcription. It is found in retroviruses like HIV.",
      stats: "89% answered correctly"
    }
  ];