import { HelperService } from './../../shared/helper.service';
import { ICity, CityDetailService } from './../city.detail/city.detail.service';
import { StorageCollections } from './../../config/constants';
import { LocalStorageProvider, ILocalStorageQuery } from './../../shared/storage.provider';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable, Observer } from 'rxjs'

@Injectable()
export class CitiesListService {
    constructor(private _http: Http, private _storage: LocalStorageProvider, private _citiesDetailService: CityDetailService, private _helperService: HelperService) { }

    /**
     * @description method for getting cities list
     */
    getCitiesList(): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            this._storage.get(<ILocalStorageQuery>{
                collection: StorageCollections.city
            }).subscribe(list => {
                observer.next(list);
            });
        });
    }

    /**
     * @description method for checking and getting current city
     */
    getCurrentCity(): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            navigator.geolocation.getCurrentPosition(result => {
                this._helperService.getCityByCoordinates(result.coords.latitude, result.coords.longitude)
                    .subscribe(response => {
                        this.addCityToList(response, true)
                            .subscribe(data => {
                                observer.next(data);
                            });
                    });
            });
        });
    }

    /**
     * @description method for creating city object
     * @param city - the city object
     * @param isLocal - local autoadd flag
     */
    addCityToList(city: ICity, isLocal: boolean = false): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            this._citiesDetailService.getCityDetails(city)
                .subscribe(data => {
                    if (isLocal) city.local = true;
                    city.name = data.name;
                    city.country = data.sys.country;
                    city.long = data.coord.lon;
                    city.lat = data.coord.lat;
                    this._storage.get(<ILocalStorageQuery>{
                        collection: StorageCollections.city,
                        fieldsEqual: [`name=${city.name}`, `country=${city.country}`]
                    }).subscribe(response => {
                        if (!response || response.length === 0) {
                            this._storage.post(<ILocalStorageQuery>{
                                collection: StorageCollections.city
                            }, city).subscribe();
                        }
                        observer.next(city);
                    });
                });
        });
    }

    /**
     * @description method for deleting city from base
     * @param city - valid city entitie
     */
    deleteCity(city: ICity): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            if(!city) return;
            if (city.local) {
                city.deleted = true;
                observer.next(this._storage.put(<ILocalStorageQuery>{
                    collection: StorageCollections.city,
                    id: city.id
                }, city));
            } else {
                observer.next(this._storage.delete(<ILocalStorageQuery>{
                    collection: StorageCollections.city,
                    id: city.id
                }));
            }
        });
    }
}