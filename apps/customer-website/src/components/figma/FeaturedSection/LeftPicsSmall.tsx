import Image from 'next/image';


export default function LeftPicsSmall() {
    return (
        <>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-[156px] rounded-[4px] size-[60px]" data-name="Obrazok" data-node-id="18218:9993">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 1"
                    width={60}
                    height={60}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-[70px] rounded-[4px] size-[76px]" data-name="Obrazok" data-node-id="18218:9994">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 2"
                    width={76}
                    height={76}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-0 rounded-[4px] size-[60px]" data-name="Obrazok" data-node-id="18218:9995">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 3"
                    width={60}
                    height={60}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[86px] mt-[121.5px] rounded-[4px] size-[43px]" data-name="Obrazok" data-node-id="18218:9996">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 4"
                    width={43}
                    height={43}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[86px] mt-[51.5px] rounded-[4px] size-[60px]" data-name="Obrazok" data-node-id="18218:9997">
                <Image
                    src="/assets/images/featured-car-blank.png"
                    alt="Car 5"
                    width={60}
                    height={60}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
        </>
    );
}