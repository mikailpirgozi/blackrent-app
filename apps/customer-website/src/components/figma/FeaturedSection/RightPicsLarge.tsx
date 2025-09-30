import Image from 'next/image';


export default function RightPicsLarge() {
    return (
        <>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[232px] mt-[408px] rounded-[4px] size-[144px]" data-name="Obrazok" data-node-id="18218:10006">
                <Image
                    src="/assets/images/featured-car-6.png"
                    alt="Car 6"
                    width={144}
                    height={144}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[176px] mt-[176px] rounded-[4px] size-[200px]" data-name="Obrazok" data-node-id="18218:10007">
                <Image
                    src="/assets/images/featured-car-7.png"
                    alt="Car 7"
                    width={200}
                    height={200}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[232px] mt-0 rounded-[4px] size-[144px]" data-name="Obrazok" data-node-id="18218:10008">
                <Image
                    src="/assets/images/featured-car-8.png"
                    alt="Car 8"
                    width={144}
                    height={144}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-[32px] mt-[120px] rounded-[4px] size-[112px]" data-name="Obrazok" data-node-id="18218:10009">
                <Image
                    src="/assets/images/featured-car-9.png"
                    alt="Car 9"
                    width={112}
                    height={112}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
            <div className="[grid-area:1_/_1] bg-center bg-cover bg-no-repeat ml-0 mt-[264px] rounded-[4px] size-[144px]" data-name="Obrazok" data-node-id="18218:10010">
                <Image
                    src="/assets/images/featured-car-10.png"
                    alt="Car 10"
                    width={144}
                    height={144}
                    className="rounded-[4px] object-cover size-full"
                />
            </div>
        </>
    );
}