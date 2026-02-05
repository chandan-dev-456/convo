import Hero from './Hero';
import HomeImage from './HomeImage';
import HomeNav from '../Navigation';
export default function HomePage() {
    return (
        <>
            <div className="HomeLayout">
                <div className="Hero">
                    <Hero></Hero>
                </div>
                <div className="HomeImage">
                    <HomeImage></HomeImage>
                </div>
            </div>
        </>
    )
}