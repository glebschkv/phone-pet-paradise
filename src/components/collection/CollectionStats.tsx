interface CollectionStatsProps {
  unlocked: number;
  total: number;
}

export const CollectionStats = ({ unlocked, total }: CollectionStatsProps) => {
  return (
    <div className="text-xs font-medium opacity-80">
      {unlocked}/{total}
    </div>
  );
};
