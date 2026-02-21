import Switch from "@/components/switch";

const SwitchField = (props: {
  id: string;
  label: string;
  desc: string;
  placeholder: string;
  mt: any;
  mb: any;
}) => {
  const { id, label, desc, mt, mb } = props;
  return (
    <div className={`flex justify-between ${mt} ${mb} items-center`}>
      <label
        htmlFor={id}
        className="max-w-[80%] hover:cursor-pointer lg:max-w-[65%]"
      >
        <h5 className="text-navy-700 text-base font-bold dark:text-white">
          {label}
        </h5>
        <p className={`text-base text-gray-600`}>{desc}</p>
      </label>
      <div>
        <Switch id={id} />
      </div>
    </div>
  );
};

export default SwitchField;
