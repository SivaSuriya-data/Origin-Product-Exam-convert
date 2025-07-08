import React from 'react';
import { EXAM_CONFIGS } from '../config/examConfigs';

interface ExamSelectorProps {
  selectedExam: string;
  onExamChange: (examCode: string) => void;
  disabled?: boolean;
}

export default function ExamSelector({ selectedExam, onExamChange, disabled = false }: ExamSelectorProps) {
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Select Exam</h3>
      {Object.values(EXAM_CONFIGS).map((exam) => (
        <button
          key={exam.code}
          onClick={() => onExamChange(exam.code)}
          disabled={disabled}
          className={`${
            selectedExam === exam.code
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
              : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200"
          } px-6 py-4 rounded-xl font-semibold text-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          <div className="text-left">
            <div className="font-bold text-lg">{exam.name}</div>
            <div className="text-sm opacity-80 mt-1">
              Max: {exam.maxFileSize}KB • {exam.allowedFormats.length} formats
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}