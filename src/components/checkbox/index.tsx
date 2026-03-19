const Checkbox = (props: {
  extra?: string;
  color?:
    | "red"
    | "blue"
    | "green"
    | "yellow"
    | "orange"
    | "teal"
    | "navy"
    | "lime"
    | "cyan"
    | "pink"
    | "purple"
    | "amber"
    | "indigo"
    | "gray";
  [x: string]: any;
}) => {
  const { extra, color, ...rest } = props;
  return (
    <input
      type="checkbox"
      className={`defaultCheckbox relative flex h-5 min-h-5 w-5 min-w-5 appearance-none items-center justify-center rounded-md border border-gray-300 transition duration-200 outline-none checked:border-none checked:bg-center checked:bg-no-repeat checked:bg-size-[14px_14px] checked:bg-[url("data:image/svg+xml,%3csvg%20viewBox='0%200%2016%2016'%20fill='white'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z'/%3e%3c/svg%3e")] hover:cursor-pointer dark:border-white/10 ${
        color === "red"


          ? "checked:border-none checked:bg-red-500 dark:checked:bg-red-400"
          : color === "blue"
            ? "checked:border-none checked:bg-blue-500 dark:checked:bg-blue-400"
            : color === "green"
              ? "checked:border-none checked:bg-green-500 dark:checked:bg-green-400"
              : color === "yellow"
                ? "checked:border-none checked:bg-yellow-500 dark:checked:bg-yellow-400"
                : color === "orange"
                  ? "checked:border-none checked:bg-orange-500 dark:checked:bg-orange-400"
                  : color === "teal"
                    ? "checked:border-none checked:bg-teal-500 dark:checked:bg-teal-400"
                    : color === "navy"
                      ? "checked:bg-navy-500 dark:checked:bg-navy-400 checked:border-none"
                      : color === "lime"
                        ? "checked:border-none checked:bg-lime-500 dark:checked:bg-lime-400"
                        : color === "cyan"
                          ? "checked:border-none checked:bg-cyan-500 dark:checked:bg-cyan-400"
                          : color === "pink"
                            ? "checked:border-none checked:bg-pink-500 dark:checked:bg-pink-400"
                            : color === "purple"
                              ? "checked:border-none checked:bg-purple-500 dark:checked:bg-purple-400"
                              : color === "amber"
                                ? "checked:border-none checked:bg-amber-500 dark:checked:bg-amber-400"
                                : color === "indigo"
                                  ? "checked:border-none checked:bg-indigo-500 dark:checked:bg-indigo-400"
                                  : color === "gray"
                                    ? "checked:border-none checked:bg-gray-500 dark:checked:bg-gray-400"
                                    : "checked:bg-brand-500 dark:checked:bg-brand-400"
      } ${extra}`}
      name="weekly"
      {...rest}
    />
  );
};

export default Checkbox;
