export default function RaceImage({ raceKey }) {
  return (
    <img
      className="race-image"
      src={`/images/races/${raceKey}.jpg`}
      alt=""
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}
