import Card from "@/components/card";
import { useState } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";

const NftCard = (props: {
  image: string;
  title: string;
  author: string;
  bidders: string[];
  download?: string;
  price: string | number;
  extra?: string;
}) => {
  const { title, author, price, image, bidders, extra } = props;
  const [heart, setHeart] = useState(true);
  return (
    <Card
      extra={`flex flex-col w-full h-full !p-4 3xl:p-![18px] bg-white ${extra}`}
    >
      <div className="h-full w-full">
        <div className="relative w-full">
          <img
            src={image}
            className="3xl:h-full 3xl:w-full mb-3 h-full w-full rounded-md"
            alt=""
          />
          <button
            onClick={() => setHeart(!heart)}
            className="text-brand-500 absolute top-3 right-3 flex items-center justify-center rounded-md bg-white p-2 hover:cursor-pointer"
          >
            <div className="dark:text-navy-900 flex h-full w-full items-center justify-center rounded-md text-xl hover:bg-gray-50">
              {heart ? (
                <IoHeartOutline />
              ) : (
                <IoHeart className="text-brand-500" />
              )}
            </div>
          </button>
        </div>

        <div className="3xl:flex-row 3xl:justify-between mb-3 flex items-center justify-between px-1 md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col xl:items-start">
          <div className="mb-2">
            <p className="text-navy-700 text-lg font-bold dark:text-white">
              {" "}
              {title}{" "}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-600 md:mt-2">
              By {author}{" "}
            </p>
          </div>

          <div className="flex flex-row-reverse md:mt-2 lg:mt-0">
            <span className="text-navy-700 dark:!border-navy-800 z-0 ml-px inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#E0E5F2] text-xs dark:bg-gray-800 dark:text-white">
              +5
            </span>
            {bidders.map((avt, key) => (
              <span
                key={key}
                className="dark:!border-navy-800 z-10 -mr-3 h-8 w-8 rounded-full border border-white"
              >
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={avt}
                  alt=""
                />
              </span>
            ))}
          </div>
        </div>

        <div className="3xl:flex-row 3xl:items-center 3xl:justify-between flex items-center justify-between md:flex-col md:items-start lg:flex-row lg:justify-between xl:flex-col 2xl:items-start">
          <div className="flex">
            <p className="text-brand-500 mb-2 text-sm font-bold dark:text-white">
              Current Bid: {price} <span>ETH</span>
            </p>
          </div>
          <button className="linear bg-brand-900 hover:bg-brand-800 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 rounded-md px-4 py-2 text-base font-medium text-white transition duration-200 dark:active:opacity-90">
            Place Bid
          </button>
        </div>
      </div>
    </Card>
  );
};

export default NftCard;
