type Props = {
  text: string;
};

export const StrokeText = ({ text }: Props) => {
  return (
    <svg className="strokeText">
      <text  y="50%" dominantBaseline="central">
        {text}
      </text>
    </svg>
  );
};
